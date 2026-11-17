import dotenv from "dotenv";
import express from "express";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import connectDB from "./config/db.js";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import helmet from "helmet";
import showRoutes from "./routes/showRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";


const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.use((req, res, next) => {
     if (process.env.VERCEL && req.url.startsWith("/api/")) {
          req.url = req.url.slice(4);
     }
     next();
});
app.use(["/user", "/shows"], async (req, res, next) => {
     try {
          await connectDB();
          next();
     } catch (error) {
          next(error);
     }
});
// The catalog and AI only use the database as a cache, so they keep working without it.
app.use(["/catalog", "/ai"], async (req, res, next) => {
     await Promise.race([connectDB(), new Promise((r) => setTimeout(r, 3000))]).catch((e) =>
          console.warn("[db] cache unavailable:", e.message),
     );
     next();
});

app.use("/user", userRoutes);
app.use("/shows", showRoutes);
app.use("/ai", aiRoutes);
app.use("/catalog", catalogRoutes);
app.use((error, req, res, next) => {
     console.error("API request failed:", error.message);
     const status = error.code === "LIMIT_FILE_SIZE" ? 413 : error.status || 500;
     res.status(status).json({
          error:
               status === 413
                    ? "Uploaded image must be 4 MB or smaller."
                    : status === 415
                      ? error.message
                      : "The server could not complete the request.",
     });
});

export default app;

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
     const port = process.env.PORT || 9001;
     await connectDB();
     app.listen(port, () => {
          console.log(`server is running on port ${port}`);
     });
}
