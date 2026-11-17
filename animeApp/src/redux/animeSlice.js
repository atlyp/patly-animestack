import { createSlice } from "@reduxjs/toolkit";

const initialState = {
     shows: [],
     // [] means "All"; several entries means a show must have every one of them
     genreFilter: [],
     sortFilter: "A-Z",
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
     setGenreFilter,
     toggleGenre,
     setWayToSort,
     setSearchedShows,
     setWhatWasSearched,
     setFocusedShow,
     setAiQuery,
} = animeSlice.actions;
export default animeSlice.reducer;
