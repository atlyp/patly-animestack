import { createSlice } from "@reduxjs/toolkit";

const initialState = {
     shows: [],
     // [] means "All"; several entries means a show must have every one of them
     genreFilter: [],
     sortFilter: "Popular",
     filteredShows: [],
     whatWasSearched: "",
     // the show open in the details modal (any component can open it)
     focusedShow: null,
     // a query handed to the AI finder from elsewhere (e.g. the ⌘K palette)
     aiQuery: "",
};

export const animeSlice = createSlice({
     name: "Anime State",
     initialState,
     reducers: {
          setShows: (state, action) => {
               state.shows = action.payload;
          },
          // Every show the app has seen (browse results, AI picks, saved shows), newest data wins.
          mergeShows: (state, action) => {
               const incoming = (action.payload || []).filter((s) => s?.mal_id);
               if (!incoming.length) return;
               const index = new Map(state.shows.map((s, i) => [s.mal_id, i]));
               for (const show of incoming) {
                    const i = index.get(show.mal_id);
                    if (i === undefined) {
                         index.set(show.mal_id, state.shows.length);
                         state.shows.push(show);
                    } else state.shows[i] = { ...state.shows[i], ...show };
               }
               if (state.focusedShow) {
                    const fresh = incoming.find((s) => s.mal_id === state.focusedShow.mal_id);
                    if (fresh) state.focusedShow = { ...state.focusedShow, ...fresh };
               }
          },
          setGenreFilter: (state, action) => {
               // the navbar dropdown picks a single genre, or "All" to clear
               state.genreFilter = action.payload === "All" ? [] : [action.payload];
          },
          toggleGenre: (state, action) => {
               const g = action.payload;
               state.genreFilter = state.genreFilter.includes(g)
                    ? state.genreFilter.filter((x) => x !== g)
                    : [...state.genreFilter, g];
          },
          setWayToSort: (state, action) => {
               state.sortFilter = action.payload;
          },
          setSearchedShows: (state, action) => {
               state.filteredShows = action.payload;
          },
          setWhatWasSearched: (state, action) => {
               state.whatWasSearched = action.payload;
          },
          setFocusedShow: (state, action) => {
               state.focusedShow = action.payload;
          },
          setAiQuery: (state, action) => {
               state.aiQuery = action.payload;
          },
     },
});
export const {
     setShows,
     mergeShows,
     setGenreFilter,
     toggleGenre,
     setWayToSort,
     setSearchedShows,
     setWhatWasSearched,
     setFocusedShow,
     setAiQuery,
} = animeSlice.actions;
export default animeSlice.reducer;
