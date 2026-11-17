import { useEffect } from "react";
import "./App.css";
import "./features.css";
import "./progress.css";
import "./tonight.css";
import { Dashboard } from "./pages/Dashboard.jsx";
import { NavbarEl } from "./components/NavbarEl.jsx";
import { useDispatch, useSelector } from "react-redux";
import { mergeShows } from "./redux/animeSlice.js";
import { Route, Routes } from "react-router";
import { MyProfile } from "./pages/MyProfile.jsx";
import { LogInSignUp } from "./pages/LogInSignUp.jsx";
import naruto from "anime-naruto-run";
import { useLocation } from "react-router";
import { ShowModal } from "./components/ShowModal.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";

function App() {
     let location = useLocation();
     const dispatch = useDispatch();
     const myShows = useSelector((state) => state.userKey.userLoggedIn?.myShows);
     useEffect(() => {
          naruto({ duration: 1000, size: 500 });
     }, [location]);
     //   running naruto^^!!

     // Saved shows carry a snapshot of their details; make them known app-wide
     // (progress totals, Continue Watching, the details modal…).
     useEffect(() => {
          if (myShows?.length) dispatch(mergeShows(myShows.map((x) => x.snapshot).filter(Boolean)));
     }, [dispatch, myShows]);

     return (
          <>
               <div>
                    <NavbarEl />
                    <div className="sky" aria-hidden="true" />
                    <ShowModal />
                    <CommandPalette />
                    <Routes>
                         <Route path="/" element={<LogInSignUp />} />
                         <Route path="/dashboard" element={<Dashboard />} />
                         <Route path="/myprofile" element={<MyProfile />} />
                    </Routes>
               </div>
          </>
     );
}

export default App;
