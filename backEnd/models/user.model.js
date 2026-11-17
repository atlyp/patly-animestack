import mongoose from "mongoose";
import { BY_ID } from "../catalog.js";
import { slim } from "../anilist.js";
export const showSchema = new mongoose.Schema({
     mal_id: Number,
     title: String,
     title_japanese: String,
     score: Number,
     scored_by: Number,
     rank: Number,
     members: Number,
     favorites: Number,
     // watch progress (shows saved before this existed get these defaults on read)
     episodesWatched: { type: Number, default: 0, min: 0 },
     status: { type: String, enum: ["plan", "watching", "completed", "dropped"], default: "plan" },
     progressUpdatedAt: Date,
     // a copy of the show's details at save time, so My List renders without extra lookups
     snapshot: mongoose.Schema.Types.Mixed,
});
const userSchema = new mongoose.Schema(
     {
          email: { type: String, required: true },
          username: { type: String, required: true },
          password: { type: String, required: true },
          myShows: [showSchema],
          profileImgPath: {type:String, required:true},
          // we will not use this field to store the image itself- we are using this to store a STRING that points to where the image lives on disk!
     },
     { timestamps: true },
);
// Never send the password hash to a client.
// Shows saved before snapshots existed all came from the bundled catalog, so fill those in.
const hidePassword = (doc, ret) => {
     delete ret.password;
     for (const entry of ret.myShows || []) {
          if (!entry.snapshot && BY_ID.has(entry.mal_id)) entry.snapshot = slim(BY_ID.get(entry.mal_id));
     }
     return ret;
};
userSchema.set("toJSON", { transform: hidePassword });

const profileImageSchema = new mongoose.Schema({
      contentType: { type: String, required: true },
      data: { type: Buffer, required: true },
});

export const ProfileImage = mongoose.model("ProfileImage", profileImageSchema);
export default mongoose.model("User", userSchema);
