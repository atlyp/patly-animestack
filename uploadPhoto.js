// Import Express so we can create a backend server.
// Express handles incoming HTTP requests such as:
// GET /users
// POST /users
import express from "express";

// Mongoose allows Node.js to communicate with MongoDB.
// It gives us models, schemas, and database methods.
import mongoose from "mongoose";

// Multer is middleware specifically designed for handling file uploads.
// Without Multer, Express cannot easily process uploaded images.
import multer from "multer";

// Allows our React frontend to make requests to this backend.
// Without CORS, the browser will block requests coming from
// a different origin (different port/domain).
import cors from "cors";

// Node's built-in path module helps us safely build file paths.
// This is important because Windows and Mac/Linux use different
// path separators.
import path from "path";

// In ES Modules (__dirname does not exist by default).
// We need fileURLToPath so we can recreate __dirname.
import { fileURLToPath } from "url";


// =======================================================
// RECREATE __FILENAME AND __DIRNAME
// =======================================================

// import.meta.url gives us the current file location as a URL.
//
// Example:
//
// file:///C:/Projects/fullstack/backend/server.js
//
// fileURLToPath converts that URL into a normal file path.
const __filename = fileURLToPath(import.meta.url);

// path.dirname extracts the folder containing this file.
//
// Example:
//
// C:/Projects/fullstack/backend
//
// We store that in __dirname so we can build paths
// relative to the location of this server file.
const __dirname = path.dirname(__filename);


// =======================================================
// BUILD AN ABSOLUTE PATH TO THE UPLOADS FOLDER
// =======================================================

// Our project structure looks something like:
//
// fullstack
// ├── backend
// │   └── server.js
// └── public
//     └── uploads
//
// Since server.js is inside backend,
// "../public/uploads" means:
//
// "go up one folder"
// then
// "go into public/uploads"
//
// path.join creates the correct path regardless of OS.
const uploadsPath = path.join(
  __dirname,
  "../public/uploads"
);


// =======================================================
// CREATE EXPRESS APPLICATION
// =======================================================

const app = express();


// =======================================================
// MIDDLEWARE
// =======================================================

// Allow requests from React.
app.use(cors());

// Allow Express to parse incoming JSON data.
//
// Example:
//
// {
//   "name": "Alex"
// }
//
// This is not used for file uploads,
// but it's a good default middleware.
app.use(express.json());


// =======================================================
// SERVE IMAGES TO THE BROWSER
// =======================================================

// This line is incredibly important.
//
// It tells Express:
//
// "When someone requests /uploads,
// look inside uploadsPath and serve files."
//
// Example:
//
// Browser requests:
//
// http://localhost:3000/uploads/cat.jpg
//
// Express looks for:
//
// uploadsPath/cat.jpg
//
// and sends the image back.
app.use("/uploads", express.static(uploadsPath));


// =======================================================
// CONNECT TO MONGODB
// =======================================================

// Create a database called:
//
// user-photo
//
// If it doesn't exist MongoDB creates it automatically.
mongoose.connect("mongodb://localhost:27017/user-photo");


// =======================================================
// USER MODEL
// =======================================================

// A Schema describes the shape of our documents.
//
// Each user document will look like:
//
// {
//   _id: "...",
//   name: "Alex",
//   photoPath: "/uploads/123-cat.jpg"
// }
//
// Notice:
//
// We are NOT storing the image itself.
//
// We are only storing a string that points to
// where the image lives on disk.
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    photoPath: String,
  })
);


// =======================================================
// MULTER STORAGE CONFIGURATION
// =======================================================

// Multer needs to know:
//
// 1. Where should uploaded files go?
// 2. What should the file be named?
const storage = multer.diskStorage({

  // Runs whenever a file is uploaded.
  destination: (req, file, cb) => {
// no file found return error message
if (!file) {
  return cb(new Error("No file provided"), null);
}

// no path found return error message
if (!uploadsPath) {
  return cb(new Error("Upload folder missing"), null);
}

// success, null meaning no error, send to "uploadsPath"
  cb(null, uploadsPath);
  },

  // Runs when Multer determines the filename.
  filename: (req, file, cb) => {

    // file.originalname might be:
    //
    // cat.jpg
    //
    // profile.png
    //
    // We prepend Date.now() to avoid collisions.
    //
    // Without this:
    //
    // User A uploads profile.jpg
    // User B uploads profile.jpg
    //
    // User B would overwrite User A.
    //
    // With Date.now():
    //
    // 1781098875-profile.jpg
    // 1781099000-profile.jpg
    //
    // Both files remain unique.
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});


// Create a Multer instance using the storage rules above.
const upload = multer({ storage });


// =======================================================
// CREATE USER + UPLOAD PHOTO
// =======================================================

// POST /users
//
// This route handles:
//
// 1. Uploading the image
// 2. Saving the image to disk
// 3. Creating the MongoDB user
//
// All in one request.
app.post(
  "/users",

  // Middleware:
  //
  // Look for a single uploaded file
  // whose form field is named "photo".
  //
  // React:
  //
  // formData.append("photo", file)
  upload.single("photo"),

  async (req, res) => {
    try {

      // At this point Multer has already:
      //
      // 1. Received the file
      // 2. Saved it to uploadsPath
      // 3. Created req.file
      //
      // Example:
      //
      // req.file.filename
      //
      // 1781098875-cat.jpg

      const user = await User.create({

        // Comes from:
        //
        // formData.append("name", userName)
        name: req.body.name,

        // Store the PUBLIC URL path.
        //
        // We do NOT store:
        //
        // C:/Projects/fullstack/public/uploads/cat.jpg
        //
        // We store:
        //
        // /uploads/cat.jpg
        //
        // This is what the browser needs.
        photoPath: `/uploads/${req.file.filename}`,
      });

      // Send the newly created user back to React.
      res.json(user);

    } catch (error) {

      console.error(error);

      res.status(500).json(error);
    }
  }
);


// =======================================================
// GET ALL USERS
// =======================================================

// GET /users
//
// React calls this route to retrieve every user.
app.get("/users", async (req, res) => {

  // Find all documents in the collection.
  const users = await User.find();

  // Send them back as JSON.
  res.json(users);
});


// =======================================================
// START SERVER
// =======================================================

// Tell Express to listen for requests on port 3000.
//
// Once running:
//
// GET  http://localhost:3000/users
// POST http://localhost:3000/users
//
// are available.
app.listen(3000, () => {
  console.log("Server running");
});