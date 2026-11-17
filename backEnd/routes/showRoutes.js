import express from "express";
import { showSchema } from "../models/user.model.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { totalEpisodes } from "../catalog.js";
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
router.post("/addToList", async (req, res) => {
     const { showToAdd, userId } = req.body;
     try {
          const targetUser = await User.findById(userId);
          if (targetUser.myShows.find((show) => show.mal_id == showToAdd.mal_id))
               return res.json({ error: "this show is already in your list" });
          const tUserAfter = await User.findByIdAndUpdate(
               userId,
               { myShows: [...targetUser.myShows, showToAdd] },
               { returnDocument: "after" },
          );

          res.json({ data: tUserAfter });
     } catch (e) {
          res.json({ error: e.message });
     }
});
router.delete("/deleteFromMyList/:userId", async (req, res) => {
     const { userId } = req.params;
     // console.log(req.body);
     const { showsMalId } = req.body;
     try {
          const targetUser = await User.findById(userId);
          const filteredShows = targetUser.myShows.filter((show) => show.mal_id !== parseInt(showsMalId));
          console.log(filteredShows);
          const updatedUser = await User.findByIdAndUpdate(
               userId,
               { myShows: [...filteredShows] },
               { returnDocument: "after" },
          );
          res.json({ data: updatedUser });
     } catch (error) {
          res.json({ error: error.message });
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

router.patch("/progress/:userId", async (req, res) => {
     const { userId } = req.params;
     const malId = Number(req.body?.mal_id);
     const { episodesWatched, status } = req.body || {};

     if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: "Invalid user id." });
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
          res.status(500).json({ error: e.message });
     }
});

export default router;
