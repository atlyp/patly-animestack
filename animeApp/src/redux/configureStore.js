import { configureStore } from "@reduxjs/toolkit";

import animeReducer from "./animeSlice.js";
import userReducer from './userSlice.js'

export const store = configureStore({
    reducer: {
        animeKey: animeReducer,
        userKey:userReducer
    },
});
