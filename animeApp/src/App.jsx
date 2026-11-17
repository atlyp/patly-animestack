import { useEffect, useState } from "react";
import "./App.css";
import "./features.css";
import "./progress.css";
import { Dashboard } from "./pages/Dashboard.jsx";
import { NavbarEl } from "./components/NavbarEl.jsx";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedShows, setShows } from "./redux/animeSlice.js";
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
  const { shows } = useSelector((state) => state.animeKey);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  useEffect(() => {
       // console.log(location);
       naruto({ duration: 1000, size: 500 });
  }, [location]);
//   running naruto^^!!
  useEffect(() => {
    if (shows?.length) return;

    let active = true;
    const fetchAnimes = async () => {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        const responses = await Promise.all([
          fetch("/anime.json"),
          fetch("/anime_new.json"),
        ]);
        const failedResponse = responses.find((response) => !response.ok);
        if (failedResponse) {
          throw new Error(`Catalog request failed (${failedResponse.status}).`);
        }

        const [data, data2] = await Promise.all(responses.map((response) => response.json()));
        if (!Array.isArray(data.data) || !Array.isArray(data2.data)) {
          throw new Error("The catalog files have an unexpected format.");
        }

        const allShows = data.data.concat(data2.data);
        if (active) {
          dispatch(setShows(allShows));
          dispatch(setSearchedShows(allShows));
        }
      } catch (error) {
        console.error("Unable to load anime catalog:", error);
        if (active) {
          setCatalogError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (active) setCatalogLoading(false);
      }
    };

    fetchAnimes();
    return () => {
      active = false;
    };
  }, [dispatch, shows?.length]);
  return (
    <>
      <div>
        <NavbarEl />
        <div className="sky" aria-hidden="true" />
        <ShowModal />
        <CommandPalette />
        <Routes>
          <Route path="/" element={<LogInSignUp />} />
          <Route
            path="/dashboard"
            element={<Dashboard catalogLoading={catalogLoading} catalogError={catalogError} />}
          />
          <Route path="/myprofile" element={<MyProfile />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
