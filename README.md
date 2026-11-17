# Anime Stack

## Local development

1. Run `npm install` from the repository root.
2. If `backEnd/.env` does not already exist, copy `backEnd/.env.example` to `backEnd/.env`; set `MONGO_URI` there to your MongoDB connection string.
3. In one terminal, run `npm run dev:api`; in another, run `npm run dev`.

The Vite development server proxies `/api` requests to the local Express server on port 9001.

## Deploying to Vercel

Deploy the repository root as a single Vercel project. The Vercel configuration builds the Vite app from `animeApp` and exposes the Express API as Vercel Functions. Client-side routes are rewritten to the app entry point.

Set these Vercel project environment variables for Production and Preview:

- `MONGO_URI` — MongoDB Atlas connection string for the database.
- `GEMINI_API_KEY` — optional, free from aistudio.google.com; enables AI recommendations. The app has an offline recommendation fallback without it.

No frontend API URL is required: the deployed app and API use the same domain.

In MongoDB Atlas, create a database user with access only to this app's database. Configure Atlas Network Access to allow Vercel's outbound connections; if using `0.0.0.0/0`, use a strong database password and least-privilege database user. Never commit `.env` files or put database credentials in frontend environment variables.

User profile images are stored in MongoDB (up to 4 MB each) so uploads persist across serverless invocations and deployments.
