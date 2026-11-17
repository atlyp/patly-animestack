// Full anime catalog from AniList's free GraphQL API (https://anilist.gitbook.io/anilist-apiv2-docs).
// AniList allows ~30 requests/minute per IP, so everything here is batched and cached
// (in memory per server instance, plus a shared MongoDB cache for show details).
// Shows are normalized to the same shape the app already used (MyAnimeList-style, keyed by mal_id).
import mongoose from "mongoose";
import { BY_ID } from "./catalog.js";

const ENDPOINT = "https://graphql.anilist.co";

export const GENRES = [
     "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music",
     "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];

const MEDIA = `
  id idMal title { romaji english native } format status episodes duration averageScore popularity favourites
  season seasonYear startDate { year month day } endDate { year month day } isAdult
  coverImage { extraLarge large } bannerImage genres tags { name rank isMediaSpoiler isAdult }
  studios(isMain: true) { nodes { name } } trailer { id site }
  nextAiringEpisode { episode airingAt }
  externalLinks { site url type language }
  description(asHtml: false)
`;

// ── HTTP with a polite retry on rate limits ──
export async function gql(query, variables = {}) {
     for (let attempt = 0; ; attempt++) {
          const resp = await fetch(ENDPOINT, {
               method: "POST",
               headers: { "Content-Type": "application/json", Accept: "application/json" },
               body: JSON.stringify({ query, variables }),
               signal: AbortSignal.timeout(15000),
          });
          if (resp.status === 429 && attempt < 1) {
               const wait = Math.min(Number(resp.headers.get("retry-after")) || 2, 4);
               await new Promise((r) => setTimeout(r, wait * 1000));
               continue;
          }
          const json = await resp.json().catch(() => ({}));
          if (!resp.ok || json.errors?.length) {
               const err = new Error(json.errors?.[0]?.message || `AniList returned ${resp.status}`);
               err.status = resp.status;
               throw err;
          }
          return json.data;
     }
}

// ── Normalizing AniList → the app's show shape ──
const FORMAT = { TV: "TV", TV_SHORT: "TV", MOVIE: "Movie", OVA: "OVA", ONA: "ONA", SPECIAL: "Special", MUSIC: "Music" };
const STATUS = {
     RELEASING: "Currently Airing",
     FINISHED: "Finished Airing",
     NOT_YET_RELEASED: "Not yet aired",
     CANCELLED: "Cancelled",
     HIATUS: "On hiatus",
};
const isoDate = (d) => (d?.year ? new Date(Date.UTC(d.year, (d.month || 1) - 1, d.day || 1)).toISOString() : null);
const prettyDate = (d) =>
     d?.year ? new Date(Date.UTC(d.year, (d.month || 1) - 1, d.day || 1)).toLocaleDateString("en-US", { year: "numeric", month: d.month ? "short" : undefined, day: d.day ? "numeric" : undefined, timeZone: "UTC" }) : "?";
const cleanText = (html) =>
     (html || "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&quot;/g, '"')
          .replace(/&#039;|&apos;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

export function normalize(m) {
     if (!m?.idMal) return null;
     const type = FORMAT[m.format] || m.format || "TV";
     const from = isoDate(m.startDate);
     const ongoing = m.status === "RELEASING";
     const streaming = (m.externalLinks || [])
          .filter((l) => l.type === "STREAMING" && (!l.language || l.language === "English" || l.language === "Japanese"))
          .reduce((list, l) => (list.some((x) => x.name === l.site) ? list : [...list, { name: l.site, url: l.url }]), []);
     return {
          mal_id: m.idMal,
          anilist_id: m.id,
          title: m.title?.romaji || m.title?.english,
          title_english: m.title?.english || null,
          title_japanese: m.title?.native || null,
          images: { jpg: { large_image_url: m.coverImage?.extraLarge || m.coverImage?.large, image_url: m.coverImage?.large } },
          banner: m.bannerImage || null,
          type,
          episodes: m.episodes ?? null,
          duration: m.duration ? `${m.duration} min${type === "Movie" ? "" : " per ep"}` : null,
          status: STATUS[m.status] || m.status,
          airing: ongoing,
          aired: {
               from,
               string: type === "Movie" ? prettyDate(m.startDate) : `${prettyDate(m.startDate)} to ${ongoing ? "?" : prettyDate(m.endDate)}`,
          },
          year: m.seasonYear || m.startDate?.year || null,
          season: m.season ? m.season.toLowerCase() : null,
          score: m.averageScore ? Math.round(m.averageScore) / 10 : null,
          members: m.popularity ?? null,
          favorites: m.favourites ?? null,
          rating: m.isAdult ? "Adult" : null,
          synopsis: cleanText(m.description),
          genres: (m.genres || []).filter((g) => g !== "Hentai").map((name) => ({ name })),
          themes: (m.tags || [])
               .filter((t) => !t.isMediaSpoiler && !t.isAdult && t.rank >= 60)
               .slice(0, 6)
               .map((t) => ({ name: t.name })),
          studios: (m.studios?.nodes || []).map((s) => ({ name: s.name })),
          trailer: m.trailer?.site === "youtube" ? { embed_url: `https://www.youtube-nocookie.com/embed/${m.trailer.id}` } : null,
          nextAiring: m.nextAiringEpisode ? { episode: m.nextAiringEpisode.episode, at: m.nextAiringEpisode.airingAt * 1000 } : null,
          streaming,
          isAdult: Boolean(m.isAdult),
          source: "anilist",
     };
}

// A smaller copy kept inside each saved show, so My List renders without extra lookups.
export const slim = (s) =>
     s && {
          mal_id: s.mal_id,
          title: s.title,
          title_english: s.title_english,
          title_japanese: s.title_japanese,
          images: s.images,
          type: s.type,
          episodes: s.episodes,
          status: s.status,
          airing: s.airing,
          aired: s.aired,
          year: s.year,
          score: s.score,
          duration: s.duration,
          rating: s.rating,
          synopsis: s.synopsis,
          genres: s.genres,
          themes: s.themes,
     };

// ── Caches ──
const memory = new Map(); // key -> { value, expires }
const remember = async (key, ttlMs, fn) => {
     const hit = memory.get(key);
     if (hit && hit.expires > Date.now()) return hit.value;
     const value = await fn();
     memory.set(key, { value, expires: Date.now() + ttlMs });
     if (memory.size > 500) memory.delete(memory.keys().next().value);
     return value;
};

const AnimeCache =
     mongoose.models.AnimeCache ||
     mongoose.model(
          "AnimeCache",
          new mongoose.Schema({
               _id: Number, // mal_id
               data: mongoose.Schema.Types.Mixed,
               fetchedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 14 },
          }),
     );
const dbReady = () => mongoose.connection.readyState === 1;
// airing shows change weekly (next episode), finished ones almost never
const freshFor = (show) => (show?.airing || show?.status === "Not yet aired" ? 3 * 3600e3 : 5 * 86400e3);

const showMemory = new Map(); // mal_id -> { show, fetchedAt }

// Look up shows by MyAnimeList id, fetching only what isn't cached. Returns Map(mal_id -> show).
export async function getByMalIds(ids, { fresh = false } = {}) {
     const want = [...new Set(ids.map(Number).filter(Number.isInteger))];
     const out = new Map();
     let missing = [];
     for (const id of want) {
          const hit = showMemory.get(id);
          if (hit && (!fresh || Date.now() - hit.fetchedAt < freshFor(hit.show))) out.set(id, hit.show);
          else missing.push(id);
     }
     if (missing.length && dbReady()) {
          try {
               const docs = await AnimeCache.find({ _id: { $in: missing } }).lean();
               for (const d of docs) {
                    if (fresh && Date.now() - new Date(d.fetchedAt) > freshFor(d.data)) continue;
                    out.set(d._id, d.data);
                    showMemory.set(d._id, { show: d.data, fetchedAt: new Date(d.fetchedAt).getTime() });
               }
               missing = missing.filter((id) => !out.has(id));
          } catch (e) {
               console.warn("[anilist] cache read failed:", e.message);
          }
     }
     for (let i = 0; i < missing.length; i += 50) {
          const batch = missing.slice(i, i + 50);
          try {
               const data = await gql(`query($ids:[Int]){Page(perPage:50){media(idMal_in:$ids,type:ANIME){${MEDIA}}}}`, { ids: batch });
               const found = data.Page.media.map(normalize).filter(Boolean);
               for (const show of found) {
                    out.set(show.mal_id, show);
                    showMemory.set(show.mal_id, { show, fetchedAt: Date.now() });
               }
               if (dbReady() && found.length) {
                    AnimeCache.bulkWrite(
                         found.map((show) => ({
                              replaceOne: { filter: { _id: show.mal_id }, replacement: { _id: show.mal_id, data: show, fetchedAt: new Date() }, upsert: true },
                         })),
                    ).catch((e) => console.warn("[anilist] cache write failed:", e.message));
               }
          } catch (e) {
               console.warn("[anilist] lookup failed:", e.message);
          }
     }
     // Last resort for the original 74 shows: the bundled catalog.
     for (const id of want) if (!out.has(id) && BY_ID.has(id)) out.set(id, BY_ID.get(id));
     return out;
}
export const getShow = async (malId, opts) => (await getByMalIds([malId], opts)).get(Number(malId)) || null;

const SORTS = {
     popular: "POPULARITY_DESC",
     trending: "TRENDING_DESC",
     score: "SCORE_DESC",
     az: "TITLE_ROMAJI",
     za: "TITLE_ROMAJI_DESC",
     newest: "START_DATE_DESC",
     oldest: "START_DATE",
};
export const SORT_KEYS = Object.keys(SORTS);

// Browse/search the whole catalog.
export async function search({ q = "", genres = [], sort = "popular", status = "", page = 1, perPage = 24 } = {}) {
     q = String(q).trim().slice(0, 100);
     genres = genres.filter((g) => GENRES.includes(g));
     page = Math.max(1, Math.min(200, Number(page) || 1));
     const vars = {
          page,
          perPage: Math.min(50, perPage),
          search: q || undefined,
          genres: genres.length ? genres : undefined,
          sort: [q && sort === "popular" ? "SEARCH_MATCH" : SORTS[sort] || SORTS.popular],
          status: status === "airing" ? "RELEASING" : undefined,
     };
     const key = "search:" + JSON.stringify(vars);
     return remember(key, 20 * 60e3, async () => {
          const data = await gql(
               `query($page:Int,$perPage:Int,$search:String,$genres:[String],$sort:[MediaSort],$status:MediaStatus){
                 Page(page:$page,perPage:$perPage){ pageInfo{hasNextPage}
                   media(type:ANIME,isAdult:false,search:$search,genre_in:$genres,sort:$sort,status:$status,format_not_in:[MUSIC]){${MEDIA}} } }`,
               vars,
          );
          const items = data.Page.media.map(normalize).filter(Boolean);
          items.forEach((show) => showMemory.set(show.mal_id, { show, fetchedAt: Date.now() }));
          return { items, hasNext: data.Page.pageInfo.hasNextPage };
     });
}

// Find real shows for a list of titles (used to turn AI suggestions into catalog entries).
// One request for all titles.
export async function resolveTitles(titles) {
     const list = titles.slice(0, 10);
     if (!list.length) return [];
     const fields = list
          .map((_, i) => `t${i}: Page(perPage:3){ media(type:ANIME,isAdult:false,search:$q${i},sort:[SEARCH_MATCH]){${MEDIA}} }`)
          .join("\n");
     const decl = list.map((_, i) => `$q${i}:String`).join(",");
     const data = await gql(`query(${decl}){${fields}}`, Object.fromEntries(list.map((t, i) => [`q${i}`, t])));
     return list.map((_, i) => {
          const show = (data[`t${i}`]?.media || []).map(normalize).find(Boolean) || null;
          if (show) showMemory.set(show.mal_id, { show, fetchedAt: Date.now() });
          return show;
     });
}
