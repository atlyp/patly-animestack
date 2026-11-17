import express from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import User, { ProfileImage } from "../models/user.model.js";
import { requireAuth, signToken } from "../auth.js";

const router = express.Router();
const maxImageSize = 4 * 1024 * 1024;
const allowedImageTypes = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);
const upload = multer({
     storage: multer.memoryStorage(),
     limits: { fileSize: maxImageSize },
     fileFilter: (req, file, callback) => {
          if (!allowedImageTypes.has(file.mimetype)) {
               const error = new Error("Choose a JPG, PNG, GIF, WEBP, or AVIF image.");
               error.status = 415;
               return callback(error);
          }
          callback(null, true);
     },
});

router.get("/uploads/:imageId", async (req, res, next) => {
     try {
          const image = await ProfileImage.findById(req.params.imageId);
          if (!image) return res.status(404).json({ error: "Profile image not found." });
          res.set("Content-Type", image.contentType);
          res.set("Cache-Control", "public, max-age=31536000, immutable");
          return res.send(image.data);
     } catch (error) {
          return next(error);
     }
});

// Upload a profile photo for the logged-in user.
router.post("/profileImg", requireAuth, upload.single("photo"), async (req, res) => {
     if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
     try {
          const image = await ProfileImage.create({
               contentType: req.file.mimetype,
               data: req.file.buffer,
          });
          const targetUser = await User.findByIdAndUpdate(
               req.userId,
               { profileImgPath: image.id },
               { returnDocument: "after" },
          );
          if (!targetUser) {
               await ProfileImage.findByIdAndDelete(image._id);
               return res.status(404).json({ error: "User not found." });
          }
          return res.json({ success: targetUser });
     } catch (error) {
          console.error("Unable to save profile image:", error.message);
          return res.status(500).json({ error: "Unable to save profile image." });
     }
});

router.post("/newUser", async (req, res) => {
     if (!req.body.email || !req.body.username || !req.body.password) {
          return res.status(400).json({ error: "Missing required field(s)." });
     }
     try {
          if (await User.exists({ username: req.body.username })) {
               return res.status(409).json({ error: "That username is taken." });
          }
          const hashedPassword = await bcrypt.hash(req.body.password, 10);
          const userCreated = new User({
               email: req.body.email,
               username: req.body.username,
               password: hashedPassword,
               profileImgPath: req.body.profileImgPath || "none",
          });
          await userCreated.save();
          return res.json({ data: userCreated, token: signToken(userCreated._id) });
     } catch (error) {
          return res.status(500).json({ error: "Unable to create account." });
     }
});

router.post("/signIn", async (req, res) => {
     const { username, password } = req.body;
     if (!username || !password) {
          return res.status(400).json({ error: "Enter your username and password." });
     }
     try {
          const targetUser = await User.findOne({ username });
          if (!targetUser || !(await bcrypt.compare(password, targetUser.password))) {
               return res.status(401).json({ error: "Incorrect username or password." });
          }
          return res.json({ success: true, data: targetUser, token: signToken(targetUser._id) });
     } catch (error) {
          return res.status(500).json({ error: "Unable to sign in." });
     }
});

// The logged-in user's account (replaces the old /staySignedIn/:id, which
// returned any account to anyone who knew its id).
router.get("/me", requireAuth, async (req, res) => {
     try {
          const userFound = await User.findById(req.userId);
          if (!userFound) return res.status(401).json({ error: "Account not found. Please log in again." });
          return res.json({ data: userFound });
     } catch (error) {
          return res.status(500).json({ error: "Unable to retrieve account." });
     }
});

export default router;
