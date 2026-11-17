import express from "express";
import { z } from "zod";
import { CATALOG, BY_ID } from "../catalog.js";
import { requireAuth } from "../auth.js";
import { getByMalIds, getShow, resolveTitles, slim } from "../anilist.js";

const names = (arr) => (arr || []).map((x) => x.name);
const tagsOf = (s) => [...names(s.genres), ...names(s.themes), ...names(s.demographics)];
const displayTitle = (s) => s.title_english || s.title;

// ─────────────────────────────────────────────────────────────
// Gemini (Google AI Studio free tier) — only used when GEMINI_API_KEY is set.
// Gemini suggests real titles from its own knowledge; each one is then looked up on
// AniList so every pick is a real catalog entry with a poster and details.
// If anything fails or the free quota runs out, routes fall back to the offline matcher.
// ─────────────────────────────────────────────────────────────
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const hasKey = () => Boolean(process.env.GEMINI_API_KEY);

const SYSTEM =
     "You are the recommendation engine for Yumemi, an anime discovery site, and you know anime deeply. " +
     "Only recommend anime that really exist. For each pick give its official title exactly as listed on " +
     "AniList or MyAnimeList (English or romaji) and its start year. Prefer the first season of a series unless " +
     "asked otherwise. Write reasons in a warm, specific, spoiler-free voice: point to the tone, premise, pacing " +
     "or themes that match what the viewer asked for. Keep each reason to one sentence. Never recommend hentai.";

// When the main model is busy (503) or out of free quota (429), try the other one once.
const BACKUP_MODEL = process.env.GEMINI_BACKUP_MODEL || "gemini-flash-latest";

async function askAI(prompt, schema, opts) {
     try {
          return await callGemini(MODEL, prompt, schema, opts);
     } catch (e) {
          if (![429, 500, 503].includes(e.status) || BACKUP_MODEL === MODEL) throw e;
          console.warn(`[ai] ${MODEL} unavailable (${e.status}), trying ${BACKUP_MODEL}`);
          return callGemini(BACKUP_MODEL, prompt, schema, opts);
     }
}

async function callGemini(model, prompt, schema, { maxTokens = 4000 } = {}) {
     const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
          body: JSON.stringify({
               systemInstruction: { parts: [{ text: SYSTEM }] },
               contents: [{ role: "user", parts: [{ text: prompt }] }],
               generationConfig: {
                    maxOutputTokens: maxTokens,
                    responseMimeType: "application/json",
                    responseJsonSchema: { ...z.toJSONSchema(schema), $schema: undefined },
               },
          }),
          signal: AbortSignal.timeout(12000),
     });
     const data = await resp.json().catch(() => ({}));
     if (!resp.ok) throw Object.assign(new Error(data.error?.message || `Gemini returned ${resp.status}`), { status: resp.status });
     const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("");
     if (!text) throw new Error("Gemini returned an empty answer.");
     return schema.parse(JSON.parse(text));
}

const PicksSchema = z.object({
     intro: z.string(),
     picks: z.array(z.object({ title: z.string(), year: z.number().int().nullable(), reason: z.string() })),
});

// Turn the model's titles into real catalog entries; drop ones we can't find or the viewer already has.
async function toCatalogPicks(picks, exclude = new Set(), limit = 4) {
     const shows = await resolveTitles(picks.map((p) => p.title));
     const seen = new Set();
     const out = [];
     picks.forEach((p, i) => {
          const show = shows[i];
          if (!show || show.isAdult || exclude.has(show.mal_id) || seen.has(show.mal_id)) return;
          seen.add(show.mal_id);
          out.push({ mal_id: show.mal_id, reason: p.reason, show: slim(show) });
     });
     return out.slice(0, limit);
}
// Offline picks come from the bundled catalog; attach the show so the client can render it.
const withShows = (result) => ({
     ...result,
     picks: result.picks.map((p) => ({ ...p, show: slim(BY_ID.get(p.mal_id)) })),
});

// Small in-memory cache so repeated identical asks don't use quota.
const cache = new Map();
const cached = async (key, fn) => {
     if (cache.has(key)) return cache.get(key);
     const value = await fn();
     cache.set(key, value);
     if (cache.size > 200) cache.delete(cache.keys().next().value);
     return value;
};

// ─────────────────────────────────────────────────────────────
// Offline fallback: keyword + mood matcher (no API key needed).
// ─────────────────────────────────────────────────────────────
const MOODS = [
     { words: ["cozy", "comfy", "chill", "relax", "wholesome", "calm", "healing", "slow"], tags: ["Slice of Life", "Iyashikei", "Gourmet", "Comedy"], label: "cozy" },
     { words: ["cry", "sad", "tearjerker", "emotional", "tragic", "heartbreak", "feels"], tags: ["Drama", "Tragedy"], label: "emotional" },
     { words: ["hype", "action", "fight", "fights", "battle", "epic", "intense", "badass"], tags: ["Action", "Martial Arts", "Shounen", "Super Power"], label: "hype" },
     { words: ["mind", "twist", "twists", "smart", "puzzle", "mystery", "detective", "psychological", "bender"], tags: ["Mystery", "Psychological", "Suspense", "Detective"], label: "mind-bending" },
     { words: ["funny", "laugh", "comedy", "hilarious", "silly", "goofy"], tags: ["Comedy", "Gag Humor", "Parody"], label: "funny" },
     { words: ["romance", "love", "romantic", "crush", "dating", "couple"], tags: ["Romance", "Love Polygon", "Girls Love", "Boys Love"], label: "romantic" },
     { words: ["scary", "horror", "creepy", "dark", "gore", "grim"], tags: ["Horror", "Suspense", "Gore", "Psychological"], label: "dark" },
     { words: ["space", "future", "robot", "robots", "mecha", "scifi", "sci-fi", "time"], tags: ["Sci-Fi", "Mecha", "Space", "Time Travel"], label: "sci-fi" },
     { words: ["magic", "fantasy", "dragon", "isekai", "elf", "wizard", "adventure", "journey", "quest"], tags: ["Fantasy", "Adventure", "Isekai"], label: "fantasy" },
     { words: ["sport", "sports", "team", "boxing", "volleyball", "basketball", "soccer", "competition"], tags: ["Sports", "Team Sports", "Combat Sports"], label: "sports" },
     { words: ["music", "band", "idol", "singing", "concert"], tags: ["Music", "Idols (Female)", "Idols (Male)", "Showbiz"], label: "music" },
     { words: ["school", "highschool", "classmates", "student", "students"], tags: ["School"], label: "school" },
     { words: ["family", "friendship", "friends", "found"], tags: ["Childcare", "Slice of Life", "Iyashikei"], label: "heartwarming" },
];
const STOP = new Set("a an the and or of to in on for with something show shows anime that is it me i want like but not too very really some about who where".split(" "));

function localRank(query, { exclude = new Set(), limit = 5 } = {}) {
     const q = query.toLowerCase();
     const words = q.match(/[a-z\-]+/g) || [];
     const negated = new Set();
     words.forEach((w, i) => {
          if (["not", "no", "without", "isn't", "nothing"].includes(words[i - 1]) || words[i - 2] === "not") negated.add(w);
     });

     const wantTags = new Map();
     const avoidTags = new Set();
     const moodLabels = [];
     for (const mood of MOODS) {
          const hit = words.find((w) => mood.words.includes(w));
          if (!hit) continue;
          if (negated.has(hit)) mood.tags.forEach((t) => avoidTags.add(t));
          else {
               mood.tags.forEach((t) => wantTags.set(t, (wantTags.get(t) || 0) + 1));
               moodLabels.push(mood.label);
          }
     }
     const keywords = words.filter((w) => w.length > 3 && !STOP.has(w) && !negated.has(w));
     const wantShort = /\bshort|quick|binge|weekend|few episodes|under\s*\d+/.test(q);
     const wantLong = /\blong|epic|hundreds|lots of episodes/.test(q);
     const wantMovie = /\bmovie|film\b/.test(q);

     const scored = CATALOG.filter((s) => !exclude.has(s.mal_id)).map((s) => {
          const tags = tagsOf(s);
          const syn = (s.synopsis || "").toLowerCase();
          let score = 0;
          const matched = [];
          for (const t of tags) {
               if (wantTags.has(t)) {
                    score += 3 * wantTags.get(t);
                    matched.push(t);
               }
               if (avoidTags.has(t)) score -= 5;
          }
          for (const k of keywords) {
               if (syn.includes(k)) score += 1;
               if (displayTitle(s).toLowerCase().includes(k)) score += 4;
          }
          if (wantShort && s.episodes && s.episodes <= 13) score += 2;
          if (wantLong && s.episodes && s.episodes >= 40) score += 2;
          if (wantMovie && s.type === "Movie") score += 4;
          score += (s.score || 0) / 10; // gentle tie-break toward well-rated shows
          return { s, score, matched };
     });

     scored.sort((a, b) => b.score - a.score);
     const picks = scored.slice(0, limit).map(({ s, matched }) => {
          const bits = [];
          if (matched.length) bits.push(`Hits your vibe with ${[...new Set(matched)].slice(0, 3).join(", ").toLowerCase()}`);
          else bits.push(`A well-loved ${names(s.genres).slice(0, 2).join(" / ").toLowerCase() || "pick"}`);
          if (s.episodes) bits.push(`${s.episodes} episode${s.episodes === 1 ? "" : "s"}`);
          if (s.score) bits.push(`rated ${s.score}`);
          return { mal_id: s.mal_id, reason: bits.join(" · ") + "." };
     });
     const intro = moodLabels.length
          ? `Here's what fits a ${[...new Set(moodLabels)].join(", ")} mood:`
          : "Here are the closest matches I could find:";
     return { intro, picks };
}

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
const router = express.Router();
// Only logged-in users may use the AI (it spends the free Gemini quota).
router.use((req, res, next) => (req.path === "/status" ? next() : requireAuth(req, res, next)));

const withFallback = async (res, aiFn, localFn) => {
     if (hasKey()) {
          try {
               const result = await aiFn();
               if (!result.picks || result.picks.length) return res.json({ ...result, source: "ai" });
          } catch (e) {
               console.error("[ai] Gemini call failed, using local matcher:", e?.status ?? "", e?.message);
          }
     }
     return res.json({ ...localFn(), source: "local" });
};

router.get("/status", (req, res) => res.json({ ai: hasKey(), model: MODEL, catalog: "anilist" }));

const idList = (v) => (Array.isArray(v) ? v : []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 200);
const titlesFor = async (ids) => {
     const shows = await getByMalIds(ids.slice(0, 40));
     return ids.map((id) => shows.get(id)).filter(Boolean).map(displayTitle);
};

// 1 + 2. Describe-it search and mood buttons
router.post("/find", async (req, res) => {
     const query = String(req.body?.query || "").trim().slice(0, 500);
     if (!query) return res.status(400).json({ error: "Tell me what you're in the mood for." });
     const exclude = new Set(idList(req.body?.exclude));
     return withFallback(
          res,
          () =>
               cached(`find:${query}:${[...exclude].sort()}`, async () => {
                    const out = await askAI(
                         `A viewer described what they want to watch:\n<request>${query}</request>\n\n` +
                              "Suggest the 7 best-matching anime, best first (a few extra in case some are already on their list). " +
                              "Respect anything they rule out (e.g. 'not too sad', 'short'). Mix well-known favorites with a hidden gem or two. " +
                              "`intro` is one short friendly sentence summarizing the vibe you searched for.",
                         PicksSchema,
                    );
                    return { intro: out.intro, picks: await toCatalogPicks(out.picks, exclude, 4) };
               }),
          () => withShows(localRank(query, { exclude, limit: 4 })),
     );
});

// 3. "Because you saved X…"
router.post("/because", async (req, res) => {
     const saved = idList(req.body?.savedIds);
     const avoid = idList(req.body?.avoidIds);
     if (!saved.length) return res.json({ intro: "", picks: [], source: "none" });
     const exclude = new Set([...saved, ...avoid]);
     return withFallback(
          res,
          () =>
               cached(`because:${[...saved].sort()}|${[...avoid].sort()}`, async () => {
                    const [savedTitles, avoidTitles] = await Promise.all([titlesFor(saved), titlesFor(avoid)]);
                    if (!savedTitles.length) throw new Error("Couldn't look up the saved shows.");
                    const out = await askAI(
                         `This viewer saved these shows to their list: ${savedTitles.join("; ")}.\n` +
                              (avoidTitles.length ? `They dropped these partway through, so steer away from what they have in common: ${avoidTitles.join("; ")}.\n` : "") +
                              "Recommend 7 other anime they'd likely love (not ones already listed). Each reason must start with " +
                              "'Because you saved <one of their titles>,' and explain the connection. " +
                              "`intro` is one short sentence about their taste.",
                         PicksSchema,
                    );
                    return { intro: out.intro, picks: await toCatalogPicks(out.picks, exclude, 4) };
               }),
          () => {
               // Offline: rank the bundled catalog by the saved shows' tags.
               const known = saved.filter((id) => BY_ID.has(id));
               if (!known.length) return { intro: "Save a few more shows and recommendations will appear here.", picks: [] };
               const tagCount = new Map();
               known.forEach((id) => tagsOf(BY_ID.get(id)).forEach((t) => tagCount.set(t, (tagCount.get(t) || 0) + 1)));
               const ranked = CATALOG.filter((s) => !exclude.has(s.mal_id))
                    .map((s) => ({ s, score: tagsOf(s).reduce((n, t) => n + (tagCount.get(t) || 0), 0) + (s.score || 0) / 10 }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 4);
               const picks = ranked.map(({ s }) => {
                    const tags = new Set(tagsOf(s));
                    const anchor = known.map((id) => BY_ID.get(id)).sort((a, b) => tagsOf(b).filter((t) => tags.has(t)).length - tagsOf(a).filter((t) => tags.has(t)).length)[0];
                    const shared = tagsOf(anchor).filter((t) => tags.has(t)).slice(0, 2);
                    return {
                         mal_id: s.mal_id,
                         reason: `Because you saved ${displayTitle(anchor)}${shared.length ? ` — it shares the ${shared.join(" & ").toLowerCase()} feel` : ""}.`,
                    };
               });
               return withShows({ intro: "Picked from the genres and themes you keep coming back to.", picks });
          },
     );
});

// 6. Shareable taste card
const TasteSchema = z.object({ title: z.string(), blurb: z.string(), traits: z.array(z.string()) });
router.post("/taste", async (req, res) => {
     const ids = idList(req.body?.ids).slice(0, 8);
     if (!ids.length) return res.status(400).json({ error: "Save a few shows first." });
     const shows = await getByMalIds(ids).catch(() => new Map());
     const list = ids.map((id) => shows.get(id) || BY_ID.get(id)).filter(Boolean);
     if (!list.length) return res.status(400).json({ error: "Couldn't look up your saved shows." });
     return withFallback(
          res,
          () =>
               cached(`taste:${[...ids].sort()}`, () =>
                    askAI(
                         `A viewer's favorite shows: ${list.map(displayTitle).join("; ")}.\n` +
                              "Write their anime taste profile for a shareable card. `title`: a fun 2-4 word archetype " +
                              "(like 'Cozy Chaos Enjoyer'). `blurb`: one playful sentence, max 22 words, no spoilers. " +
                              "`traits`: exactly 3 one- or two-word taste traits.",
                         TasteSchema,
                         { maxTokens: 1500 },
                    ),
               ),
          () => {
               const count = new Map();
               const META = new Set(["Award Winning", "Shounen", "Seinen", "Shoujo", "Josei", "Kids"]);
               list.forEach((s) => tagsOf(s).filter((t) => !META.has(t)).forEach((t) => count.set(t, (count.get(t) || 0) + 1)));
               const top = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
               const [a = "Story", b = "Adventure"] = top;
               return {
                    title: `${a}-${b} Devotee`,
                    blurb: `Lives for ${a.toLowerCase()} with a side of ${(top[1] || "surprises").toLowerCase()} — and has the list to prove it.`,
                    traits: top.slice(0, 3),
               };
          },
     );
});

// 7. Spoiler-free catch-up
const CatchUpSchema = z.object({ summary: z.string(), confident: z.boolean() });
router.post("/catchup", async (req, res) => {
     const show = await getShow(Number(req.body?.mal_id)).catch(() => null);
     const episode = Math.max(1, parseInt(req.body?.episode, 10) || 1);
     if (!show) return res.status(404).json({ error: "Unknown show." });
     const capped = show.episodes ? Math.min(episode, show.episodes) : episode;
     if (!hasKey()) {
          return res.json({
               summary: `Episode-by-episode recaps need AI connected on the server. Until then, the synopsis above only covers the opening setup of ${displayTitle(show)}, so it's safe to re-read.`,
               confident: false,
               source: "local",
               note: "Add GEMINI_API_KEY to backEnd/.env to turn on spoiler-safe recaps.",
          });
     }
     try {
          const out = await cached(`catchup:${show.mal_id}:${capped}`, () =>
               askAI(
                    `Recap the anime "${displayTitle(show)}" (${show.year || "?"}, ${show.type}) for a viewer who has watched through episode ${capped}` +
                         (show.episodes ? ` of ${show.episodes}` : "") +
                         ".\nRules: describe ONLY what happens up to and including that episode. Never hint at later twists, " +
                         "deaths, reveals or who wins. 4-6 sentences, plain prose. If you are not sure exactly where an " +
                         "episode boundary falls, stay vaguer rather than risk a spoiler and set `confident` to false.",
                    CatchUpSchema,
                    { maxTokens: 2000 },
               ),
          );
          return res.json({ ...out, source: "ai" });
     } catch (e) {
          console.error("[ai] catch-up failed:", e?.message);
          return res.json({ summary: show.synopsis, confident: false, source: "local", note: "Couldn't reach the AI, so here's the official synopsis." });
     }
});

export default router;
