import { createSlice } from "@reduxjs/toolkit";

const initialState = {
     loggedIn: false,
     userLoggedIn: {},
};

export const userSlice = createSlice({
     name: "User State",
     initialState,
     reducers: {
          logIn: (state, action) => {
               state.loggedIn = true;
               state.userLoggedIn = action.payload;
          },
          // merge fields into one saved show (watch progress)
          updateMyShow: (state, action) => {
               const { mal_id, ...fields } = action.payload;
               const show = state.userLoggedIn?.myShows?.find((s) => s.mal_id === mal_id);
               if (show) Object.assign(show, fields);
          },
          logOut: (state) => {
               state.loggedIn = false;
               state.userLoggedIn = {};
          },
     },
});
export const { logIn, logOut, updateMyShow, userLoggedIn, loggedIn } = userSlice.actions;
export default userSlice.reducer;