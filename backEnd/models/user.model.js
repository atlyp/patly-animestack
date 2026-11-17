import mongoose from "mongoose";
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

const profileImageSchema = new mongoose.Schema({
      contentType: { type: String, required: true },
      data: { type: Buffer, required: true },
});

export const ProfileImage = mongoose.model("ProfileImage", profileImageSchema);
export default mongoose.model("User", userSchema);
