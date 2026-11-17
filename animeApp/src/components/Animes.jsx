import { useEffect, useRef, useState } from "react";
import { CardEl } from "./CardEl.jsx";
import { Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { mergeShows, setFocusedShow, setGenreFilter, toggleGenre } from "../redux/animeSlice.js";
import { AiFinder } from "./AiFinder.jsx";
import { ContinueWatching } from "./ContinueWatching.jsx";
import { Tonight } from "./Tonight.jsx";
import { posterOf, searchCatalog } from "../api.js";
import { GENRES, SORTS } from "../catalog.js";

const SkeletonCard = () => (
     <div className="anime-grid__item">
          <div className="animeCard animeCard--skeleton" aria-hidden="true">
               <div className="skeleton skeleton--figure" />
               <div className="card-body">
                    <div className="skeleton skeleton--line" />
                    <div className="skeleton skeleton--line short" />
                    <div className="skeleton skeleton--line" />
                    <div className="skeleton skeleton--line" />
               </div>
          </div>
     </div>
);

const yearOf = (show) => show.year || (show.aired?.from ? new Date(show.aired.from).getFullYear() : "?");

function Animes() {
     const dispatch = useDispatch();
     const { whatWasSearched, genreFilter, sortFilter } = useSelector((state) => state.animeKey);
     const { userLoggedIn } = useSelector((state) => state.userKey);
     const [tab, setTab] = useState("airing"); // airing | all
     const [query, setQuery] = useState("");
     const [results, setResults] = useState({ items: [], page: 1, hasNext: false, status: "loading" });
     const browseRef = useRef(null);
     const latest = useRef(0);

     // wait for typing to pause before searching
     useEffect(() => {
          const t = setTimeout(() => setQuery(whatWasSearched.trim()), 350);
          return () => clearTimeout(t);
     }, [whatWasSearched]);

     // searching or filtering by genre looks across everything, not just this season
     const status = tab === "airing" && !query ? "airing" : "";
     const params = { q: query, genres: genreFilter, sort: SORTS[sortFilter] || "popular", status };
     const paramsKey = JSON.stringify(params);

     const load = async (page) => {
          const id = ++latest.current;
          setResults((r) => ({ ...r, status: page === 1 ? "loading" : "more" }));
          try {
               const data = await searchCatalog({ ...params, page });
               if (id !== latest.current) return;
               dispatch(mergeShows(data.items));
               setResults((r) => ({
                    items: page === 1 ? data.items : [...r.items, ...data.items.filter((x) => !r.items.some((y) => y.mal_id === x.mal_id))],
                    page,
                    hasNext: data.hasNext,
                    status: "done",
               }));
          } catch (e) {
               if (id !== latest.current) return;
               setResults((r) => ({
                    ...r,
                    status: "error",
                    message: e instanceof TypeError ? "Can't reach the Yumemi server." : e.message,
               }));
          }
     };

     useEffect(() => {
          load(1);
     }, [paramsKey]);

     const goAiring = () => {
          setTab("airing");
          dispatch(setGenreFilter("All"));
          browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
     };

     const { items } = results;
     const heroPicks = items.slice(0, 3);
     const heading = query ? `Results for “${query}”` : status === "airing" ? "Airing this season" : "Explore all anime";

     return (
          <main className="anime-library">
               <section className="library-hero">
                    <div className="library-hero__copy">
                         <p className="eyebrow">夢見 · tonight's watchlist</p>
                         <h1>
                              Find your next <span>anime obsession.</span>
                         </h1>
                         <p>Every anime, new episodes the day they drop, and where to stream them, all in one place.</p>
                    </div>
                    <div className="library-hero__stack" aria-hidden="true">
                         {heroPicks.map((show) => (
                              <img key={show.mal_id} src={posterOf(show)} alt="" />
                         ))}
                    </div>
               </section>

               <Tonight onBrowseAiring={goAiring} />

               <ContinueWatching />

               <AiFinder />

               <section className="library-toolbar" aria-label="Catalog results" ref={browseRef}>
                    <div>
                         <span className="section-kicker">The catalog</span>
                         <h2>{heading}</h2>
                    </div>
                    <div className="library-filters">
                         {!query && (
                              <div className="browse-tabs" role="tablist" aria-label="Which anime to show">
                                   {[
                                        ["airing", "Airing now"],
                                        ["all", "All anime"],
                                   ].map(([value, label]) => (
                                        <button
                                             key={value}
                                             type="button"
                                             role="tab"
                                             aria-selected={tab === value}
                                             className={`browse-tab ${tab === value ? "is-on" : ""}`}
                                             onClick={() => setTab(value)}
                                        >
                                             {label}
                                        </button>
                                   ))}
                              </div>
                         )}
                         <span className="filter-pill">Sort: {sortFilter}</span>
                    </div>
               </section>

               <div className="genre-chips" role="group" aria-label="Filter by genre (pick several)">
                    <button
                         type="button"
                         className={`genre-chip ${genreFilter.length === 0 ? "is-on" : ""}`}
                         onClick={() => dispatch(setGenreFilter("All"))}
                    >
                         All
                    </button>
                    {GENRES.map((g) => (
                         <button
                              key={g}
                              type="button"
                              aria-pressed={genreFilter.includes(g)}
                              className={`genre-chip ${genreFilter.includes(g) ? "is-on" : ""}`}
                              onClick={() => dispatch(toggleGenre(g))}
                         >
                              {g}
                         </button>
                    ))}
               </div>

               <div className="anime-grid">
                    {results.status === "error" && !items.length ? (
                         <div className="empty-results" role="alert">
                              <h3>We couldn’t load anime right now.</h3>
                              <p>{results.message} Try again in a moment.</p>
                         </div>
                    ) : results.status === "loading" ? (
                         Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
                    ) : items.length ? (
                         items.map((show) => (
                              <div className="anime-grid__item" key={show.mal_id}>
                                   <CardEl user={userLoggedIn} showItself={show} year={yearOf(show)} altText={show.title} product={show}>
                                        <Button className="moreInfoBtn" variant="primary" onClick={() => dispatch(setFocusedShow(show))}>
                                             More about this {show?.type === "Movie" ? "movie" : "show"}
                                        </Button>
                                   </CardEl>
                              </div>
                         ))
                    ) : (
                         <div className="empty-results">
                              <h3>No anime matches all of those.</h3>
                              <p>Try removing a genre, or describe what you want to Yumemi AI above.</p>
                         </div>
                    )}
               </div>

               {results.hasNext && results.status !== "loading" && (
                    <div className="load-more">
                         <button type="button" className="ghost-btn" disabled={results.status === "more"} onClick={() => load(results.page + 1)}>
                              {results.status === "more" ? "Loading…" : "Load more"}
                         </button>
                    </div>
               )}
               {results.status === "error" && items.length > 0 && <p className="ai-finder__error">{results.message}</p>}
          </main>
     );
}

export default Animes;
