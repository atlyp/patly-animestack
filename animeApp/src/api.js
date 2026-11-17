export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// ── Login session ──
// The server issues a signed token at sign-in/sign-up; every request sends it,
// and the server works out who you are from it (the client never sends a user id).
const TOKEN_KEY = "authToken";

export const getToken = () => {
     try {
          return localStorage.getItem(TOKEN_KEY);
     } catch {
          return null;
     }
};

export const saveSession = (token) => {
     localStorage.setItem(TOKEN_KEY, token);
     localStorage.setItem("loggedIn", "true");
     localStorage.removeItem("personLoggedIn"); // old id-based session, no longer used
};

export const clearSession = () => {
     localStorage.removeItem(TOKEN_KEY);
     localStorage.removeItem("loggedIn");
     localStorage.removeItem("personLoggedIn");
};

export class ApiError extends Error {
     constructor(message, status) {
          super(message);
          this.status = status;
     }
}

export const apiRequest = async (path, options = {}) => {
     const token = getToken();
     const headers = { ...(options.headers || {}) };
     if (token) headers.Authorization = `Bearer ${token}`;
     const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
     const data = await resp.json().catch(() => ({}));
     if (!resp.ok || data.error) throw new ApiError(data.error || `Server returned ${resp.status}`, resp.status);
     return data;
};

const send = (method, path, body) =>
     apiRequest(path, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
     });
const post = (path, body) => send("POST", path, body);

// ── Account ──
export const signIn = (username, password) => post("/user/signIn", { username, password });
export const signUp = (fields) => post("/user/newUser", fields);
export const fetchMe = () => apiRequest("/user/me");
export const uploadProfileImage = (file) => {
     const formData = new FormData();
     formData.append("photo", file);
     return apiRequest("/user/profileImg", { method: "POST", body: formData });
};

// ── AI features (backEnd/routes/aiRoutes.js) ──
export const aiFind = (query, exclude = []) => post("/ai/find", { query, exclude });
export const aiBecause = (savedIds, avoidIds = []) => post("/ai/because", { savedIds, avoidIds });
export const aiTaste = (ids) => post("/ai/taste", { ids });
export const aiCatchUp = (mal_id, episode) => post("/ai/catchup", { mal_id, episode });

// ── My List ──
export const addToMyList = (show) => post("/shows/addToList", { mal_id: show.mal_id });
export const removeFromMyList = (show) => send("DELETE", "/shows/deleteFromMyList", { mal_id: show.mal_id });

// Watch progress: { episodesWatched?, status? } → the updated saved-show entry
export const updateProgress = (mal_id, patch) => send("PATCH", "/shows/progress", { mal_id, ...patch });

// ── Full catalog (AniList, via backEnd/routes/catalogRoutes.js) ──
const qs = (params) =>
     new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length))).toString();
// { q, genres: [], sort, status, page } → { items, hasNext }
export const searchCatalog = (params) => apiRequest(`/catalog/search?${qs({ ...params, genres: params.genres?.join(",") })}`);
export const getAnime = (mal_id) => apiRequest(`/catalog/anime/${mal_id}`);
export const getTonight = () => apiRequest("/shows/tonight");

// Saved entries carry a snapshot of the show; catalog shows are the show itself.
export const showOf = (x) => x?.snapshot || x;
// AniList posters come from its CDN; the original 74 shows have local covers.
export const posterOf = (x) => {
     const s = showOf(x);
     const url = s?.images?.jpg?.large_image_url;
     return url && url.includes("anilist") ? url : `/anime_covers/${s?.mal_id}.jpg`;
};
export const titleOf = (x) => showOf(x)?.title_english || showOf(x)?.title;

export const profileImageUrl = (imagePath) =>
     /^[\da-f]{24}$/i.test(imagePath || "")
          ? `${API_BASE}/user/uploads/${imagePath}`
          : `/userUploads/${imagePath}`;
