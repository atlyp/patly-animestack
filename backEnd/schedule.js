// "Tonight's episodes": which of a viewer's saved shows have something new to watch.
// Pure functions (no I/O) so they're easy to test.

const DAY = 24 * 3600e3;
const WEEK = 7 * DAY;

// Where a show is in its run right now.
export function episodeState(show, now = Date.now()) {
     const next = show?.nextAiring;
     if (next?.episode) {
          const latestAired = next.episode - 1;
          // AniList gives the next air time; weekly shows aired the previous one a week earlier.
          const lastAt = latestAired >= 1 ? next.at - WEEK : null;
          return { latestAired, nextEpisode: next.episode, nextAt: next.at, lastAt };
     }
     if (show?.airing) return { latestAired: null, nextEpisode: null, nextAt: null, lastAt: null };
     return { latestAired: show?.episodes ?? null, nextEpisode: null, nextAt: null, lastAt: null };
}

// myShows: the user's saved entries ({ mal_id, episodesWatched, status })
// showsById: Map(mal_id -> show) with fresh airing info
export function tonightFor(myShows, showsById, now = Date.now()) {
     const items = [];
     for (const entry of myShows || []) {
          if (entry.status === "completed" || entry.status === "dropped") continue;
          const show = showsById.get(entry.mal_id);
          if (!show || !(show.airing || show.nextAiring)) continue;
          const st = episodeState(show, now);
          const watched = entry.episodesWatched || 0;
          const behind = st.latestAired == null ? 0 : Math.max(0, st.latestAired - watched);
          const newToday = Boolean(st.lastAt && now - st.lastAt >= 0 && now - st.lastAt < DAY && behind > 0);
          items.push({
               mal_id: entry.mal_id,
               watched,
               status: entry.status || "plan",
               behind,
               newToday,
               ...st,
          });
     }
     // New today first, then most episodes to catch up on, then whatever airs soonest.
     return items.sort(
          (a, b) =>
               Number(b.newToday) - Number(a.newToday) ||
               Number(b.behind > 0) - Number(a.behind > 0) ||
               (a.nextAt ?? Infinity) - (b.nextAt ?? Infinity),
     );
}
