import { localGet } from "../memoryUtils";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiRequest = async (path, options = {}) => {
     const resp = await fetch(`${API_BASE}${path}`, options);
     const data = await resp.json();
     if (!resp.ok || data.error) throw new Error(data.error || `Server returned ${resp.status}`);
     return data;
};

const post = (path, body) =>
     apiRequest(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
     });

// ── AI features (backEnd/routes/aiRoutes.js) ──
export const aiFind = (query, exclude = []) => post("/ai/find", { query, exclude });
export const aiBecause = (savedIds, avoidIds = []) => post("/ai/because", { savedIds, avoidIds });
export const aiTaste = (ids) => post("/ai/taste", { ids });
export const aiCatchUp = (mal_id, episode) => post("/ai/catchup", { mal_id, episode });

// ── My List ──
export const addToMyList = (show) => post("/shows/addToList", { showToAdd: show, userId: localGet("personLoggedIn") });

export const removeFromMyList = (show) =>
     apiRequest(`/shows/deleteFromMyList/${localGet("personLoggedIn")}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ showsMalId: show.mal_id }),
     });

// Watch progress: { episodesWatched?, status? } → the updated saved-show entry
export const updateProgress = (mal_id, patch) =>
     apiRequest(`/shows/progress/${localGet("personLoggedIn")}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mal_id, ...patch }),
     });

export const posterOf = (show) => `/anime_covers/${show.mal_id}.jpg`;
export const titleOf = (show) => show?.title_english || show?.title;

export const profileImageUrl = (imagePath) =>
     /^[\da-f]{24}$/i.test(imagePath || "")
          ? `${API_BASE}/user/uploads/${imagePath}`
          : `/userUploads/${imagePath}`;
