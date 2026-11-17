// The anime catalog: the same JSON files the React app serves from animeApp/public.
// Imported (not read from disk) so serverless bundlers like Vercel include them.
import animeCatalog from "../animeApp/public/anime.json" with { type: "json" };
import animeCatalogNew from "../animeApp/public/anime_new.json" with { type: "json" };

export const CATALOG = [...animeCatalog.data, ...animeCatalogNew.data];
export const BY_ID = new Map(CATALOG.map((s) => [s.mal_id, s]));

// Total episodes for a show (movies count as 1). null when unknown (e.g. still airing).
export const totalEpisodes = (malId) => {
     const show = BY_ID.get(Number(malId));
     if (!show) return null;
     if (show.type === "Movie") return 1;
     return Number.isInteger(show.episodes) && show.episodes > 0 ? show.episodes : null;
};
