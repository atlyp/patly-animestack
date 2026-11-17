import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProgress } from "./api";
import { updateMyShow } from "./redux/userSlice";

export const STATUSES = [
     { value: "watching", label: "Watching" },
     { value: "plan", label: "Plan to watch" },
     { value: "completed", label: "Completed" },
     { value: "dropped", label: "Dropped" },
];
export const statusLabel = (value) => STATUSES.find((s) => s.value === value)?.label ?? "Plan to watch";

// Same rules as nextProgress() in backEnd/routes/showRoutes.js, so the UI can
// update instantly and the server agrees with it.
export const nextProgress = (current, total, patch) => {
     let watched = patch.episodesWatched ?? current?.episodesWatched ?? 0;
     if (total) watched = Math.min(watched, total);
     let status = patch.status ?? current?.status ?? "plan";
     if (patch.status === "completed" && total) watched = total;
     else if (patch.status === undefined) {
          if (total && watched >= total) status = "completed";
          else if (watched > 0 && (status === "plan" || status === "completed")) status = "watching";
          else if (watched === 0 && status === "watching") status = "plan";
     }
     return { watched, status };
};

export const totalFor = (catalogShow) => {
     if (!catalogShow) return null;
     if (catalogShow.type === "Movie") return 1;
     return Number.isInteger(catalogShow.episodes) && catalogShow.episodes > 0 ? catalogShow.episodes : null;
};

// Shared across components so the profile card and the Continue Watching row
// batch into the same request for a show.
const pending = new Map(); // mal_id -> { timer, snapshot }
const SAVE_DELAY = 450;

export const useProgress = (malId) => {
     const dispatch = useDispatch();
     const saved = useSelector((s) => s.userKey.userLoggedIn?.myShows?.find((x) => x.mal_id === malId));
     const catalogShow = useSelector((s) => s.animeKey.shows.find((x) => x.mal_id === malId));
     const total = totalFor(catalogShow);
     const [error, setError] = useState("");

     const watched = saved?.episodesWatched ?? 0;
     const status = saved?.status ?? "plan";

     const apply = (patch) => {
          if (!saved) return;
          setError("");
          const entry = pending.get(malId) ?? {
               snapshot: { episodesWatched: watched, status, progressUpdatedAt: saved.progressUpdatedAt },
          };
          const next = nextProgress({ episodesWatched: watched, status }, total, patch);
          dispatch(
               updateMyShow({
                    mal_id: malId,
                    episodesWatched: next.watched,
                    status: next.status,
                    progressUpdatedAt: new Date().toISOString(),
               }),
          );

          clearTimeout(entry.timer);
          entry.timer = setTimeout(async () => {
               pending.delete(malId);
               try {
                    const { data } = await updateProgress(malId, { episodesWatched: next.watched, status: next.status });
                    dispatch(updateMyShow({ mal_id: malId, ...data }));
               } catch (e) {
                    dispatch(updateMyShow({ mal_id: malId, ...entry.snapshot }));
                    setError(e instanceof TypeError ? "Couldn't reach the server — progress not saved." : e.message);
               }
          }, SAVE_DELAY);
          pending.set(malId, entry);
     };

     return {
          saved,
          catalogShow,
          total,
          watched,
          status,
          error,
          percent: total ? Math.round((watched / total) * 100) : null,
          increment: () => apply({ episodesWatched: watched + 1 }),
          decrement: () => apply({ episodesWatched: Math.max(0, watched - 1) }),
          setStatus: (value) => apply({ status: value }),
          reset: () => apply({ episodesWatched: 0, status: "plan" }),
     };
};
