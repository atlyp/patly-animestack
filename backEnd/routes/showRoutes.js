import express from "express";
import { showSchema } from "../models/user.model.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { BY_ID, totalEpisodes } from "../catalog.js";
import { requireAuth } from "../auth.js";
const Show = mongoose.model("Show", showSchema);

const router = express.Router();
router.get("/getAllShows", async (req, res) => {
     try {
          const showsInDB = await Show.find({});
          return res.json({ data: showsInDB });
     } catch (e) {
          return res.json({ error: e.message });
     }
});
// Every My List route acts on the logged-in user (from the token), never on an id the client sends.
router.use(["/addToList", "/deleteFromMyList", "/progress"], requireAuth);

// Body: { mal_id }. Show details come from the catalog, not from the client.
router.post("/addToList", async (req, res) => {
     const malId = Number(req.body?.mal_id ?? req.body?.showToAdd?.mal_id);
     const show = BY_ID.get(malId);
     if (!show) return res.status(400).json({ error: "Unknown show." });
     try {
          const entry = {
               mal_id: show.mal_id,
               title: show.title,
               title_japanese: show.title_japanese,
               score: show.score,
               scored_by: show.scored_by,
               rank: show.rank,
               members: show.members,
               favorites: show.favorites,
          };
          // only adds if it's not already there, so double-clicks are harmless
          await User.updateOne({ _id: req.userId, "myShows.mal_id": { $ne: malId } }, { $push: { myShows: entry } });
          const user = await User.findById(req.userId);
          if (!user) return res.status(401).json({ error: "Account not found. Please log in again." });
          res.json({ data: user });
     } catch (e) {
          res.status(500).json({ error: "Couldn't update your list." });
     }
});

// Body: { mal_id }
router.delete("/deleteFromMyList", async (req, res) => {
     const malId = Number(req.body?.mal_id ?? req.body?.showsMalId);
     if (!Number.isInteger(malId)) return res.status(400).json({ error: "mal_id must be a number." });
     try {
          const user = await User.findByIdAndUpdate(
               req.userId,
               { $pull: { myShows: { mal_id: malId } } },
               { returnDocument: "after" },
          );
          if (!user) return res.status(401).json({ error: "Account not found. Please log in again." });
          res.json({ data: user });
     } catch (error) {
          res.status(500).json({ error: "Couldn't update your list." });
     }
});

// Update watch progress for one saved show.
// Body: { mal_id, episodesWatched?, status? } — at least one of the two.
const STATUSES = ["plan", "watching", "completed", "dropped"];

// Pure rules for the next progress state, so they're easy to test.
export const nextProgress = (current, total, patch) => {
     let watched = patch.episodesWatched ?? current?.episodesWatched ?? 0;
     if (total) watched = Math.min(watched, total);
     let status = patch.status ?? current?.status ?? "plan";

     if (patch.status === "completed" && total) watched = total; // marking complete fills the bar
     else if (patch.status === undefined) {
          // infer status from episode changes
          if (total && watched >= total) status = "completed";
          else if (watched > 0 && (status === "plan" || status === "completed")) status = "watching";
          else if (watched === 0 && status === "watching") status = "plan";
     }
     return { watched, status };
};

router.patch("/progress", async (req, res) => {
     const userId = req.userId;
     const malId = Number(req.body?.mal_id);
     const { episodesWatched, status } = req.body || {};

     if (!Number.isInteger(malId)) return res.status(400).json({ error: "mal_id must be a number." });
     if (episodesWatched === undefined && status === undefined)
          return res.status(400).json({ error: "Send episodesWatched and/or status." });
     if (episodesWatched !== undefined && (!Number.isInteger(episodesWatched) || episodesWatched < 0))
          return res.status(400).json({ error: "episodesWatched must be a whole number ≥ 0." });
     if (status !== undefined && !STATUSES.includes(status))
          return res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}.` });

     try {
          const user = await User.findOne({ _id: userId, "myShows.mal_id": malId }, { "myShows.$": 1 });
          if (!user) return res.status(404).json({ error: "That show isn't in your list." });
          const total = totalEpisodes(malId);
          const { watched, status: nextStatus } = nextProgress(user.myShows[0], total, { episodesWatched, status });

          const updated = await User.findOneAndUpdate(
               { _id: userId, "myShows.mal_id": malId },
               {
                    $set: {
                         "myShows.$.episodesWatched": watched,
                         "myShows.$.status": nextStatus,
                         "myShows.$.progressUpdatedAt": new Date(),
                    },
               },
               { returnDocument: "after", projection: { myShows: { $elemMatch: { mal_id: malId } } } },
          );
          res.json({ data: updated.myShows[0], totalEpisodes: total });
     } catch (e) {
          res.status(500).json({ error: "Couldn't save your progress." });
     }
});

export default router;
