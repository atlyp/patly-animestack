import express from "express";
import { GENRES, SORT_KEYS, getShow, search } from "../anilist.js";

const router = express.Router();

// Public, identical for everyone → let Vercel's CDN cache it.
const cacheFor = (res, seconds) => res.set("Cache-Control", `public, max-age=60, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`);

const fail = (res, e) => {
     console.error("[catalog]", e.message);
     res.status(e.status === 429 ? 503 : 502).json({
          error: e.status === 429 ? "The anime database is busy — try again in a minute." : "Couldn't reach the anime database.",
     });
};

router.get("/genres", (req, res) => {
     cacheFor(res, 86400);
     res.json({ data: GENRES, sorts: SORT_KEYS });
});

// /catalog/search?q=&genres=Action,Comedy&sort=popular&status=airing&page=1
router.get("/search", async (req, res) => {
     try {
          const genres = String(req.query.genres || "").split(",").map((g) => g.trim()).filter(Boolean);
          const result = await search({
               q: req.query.q,
               genres,
               sort: req.query.sort,
               status: req.query.status,
               page: req.query.page,
          });
          cacheFor(res, 1800);
          res.json(result);
     } catch (e) {
          fail(res, e);
     }
});

router.get("/anime/:malId", async (req, res) => {
     const id = Number(req.params.malId);
     if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Bad id." });
     try {
          const show = await getShow(id, { fresh: true });
          if (!show) return res.status(404).json({ error: "Show not found." });
          cacheFor(res, 3600);
          res.json({ data: show });
     } catch (e) {
          fail(res, e);
     }
});

export default router;
