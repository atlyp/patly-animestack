import { useEffect, useMemo, useRef } from "react";
import { CardEl } from "./CardEl.jsx";
import { Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { cardsAnimate, sortFunctionality } from "../../utilities.js";
import { setFocusedShow, setGenreFilter, toggleGenre } from "../redux/animeSlice.js";
import { AiFinder } from "./AiFinder.jsx";
import { ContinueWatching } from "./ContinueWatching.jsx";

const tagNames = (show) => [...(show.genres || []), ...(show.themes || [])].map((g) => g.name);

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

function Animes({ catalogLoading, catalogError }) {
     const dispatch = useDispatch();
     const { shows, filteredShows, whatWasSearched, genreFilter, sortFilter } = useSelector((state) => state.animeKey);
     const { userLoggedIn } = useSelector((state) => state.userKey);

     // Every selected genre/theme must be on the show (Action + Comedy = both).
     const fShows = filteredShows
          .filter((show) => genreFilter.every((g) => tagNames(show).includes(g)))
          .sort((a, b) => sortFunctionality(a, b, sortFilter));

     // Genre chips: the most common genres in the catalog
     const genreChips = useMemo(() => {
          const count = new Map();
          shows.forEach((s) => (s.genres || []).forEach((g) => count.set(g.name, (count.get(g.name) || 0) + 1)));
          return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name]) => name);
     }, [shows]);

     const heroPicks = [...shows].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
     const cardRefs = useRef({});

     useEffect(() => {
          const allCards = Object.values(cardRefs.current);
          cardsAnimate(
               allCards,
               "animation",
               "500ms ease 0s 1 normal none running easeOut",
               "600ms ease 0s 1 normal none running easeIn",
          );
     }, [sortFilter, genreFilter.join("|")]);

     const showSkeletons = catalogLoading && !fShows.length && !catalogError;

     return (
          <main className="anime-library">
               <section className="library-hero">
                    <div className="library-hero__copy">
                         <p className="eyebrow">夢見 · tonight's watchlist</p>
                         <h1>
                              Find your next <span>anime obsession.</span>
                         </h1>
                         <p>From all-time favorites to hidden gems, find a new story worth staying up for.</p>
                    </div>
                    <div className="library-hero__stack" aria-hidden="true">
                         {heroPicks.map((show) => (
                              <img key={show.mal_id} src={`/anime_covers/${show.mal_id}.jpg`} alt="" />
                         ))}
                    </div>
               </section>

               <ContinueWatching />

               <AiFinder />

               <section className="library-toolbar" aria-label="Catalog results">
                    <div>
                         <span className="section-kicker">The catalog</span>
                         <h2>Explore anime</h2>
                    </div>
                    <div className="library-filters">
                         <span className="filter-pill">Sort: {sortFilter}</span>
                         {whatWasSearched && <span className="filter-pill">Search: {whatWasSearched}</span>}
                         <span className="result-count">
                              {fShows.length} {fShows.length === 1 ? "title" : "titles"}
                         </span>
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
                    {genreChips.map((g) => (
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
                    {genreFilter
                         .filter((g) => !genreChips.includes(g))
                         .map((g) => (
                              <button key={g} type="button" className="genre-chip is-on" onClick={() => dispatch(toggleGenre(g))}>
                                   {g} ×
                              </button>
                         ))}
               </div>

               <div className="anime-grid">
                    {catalogError ? (
                         <div className="empty-results" role="alert">
                              <h3>We couldn’t load the anime catalog.</h3>
                              <p>{catalogError} Check that the local anime JSON files are available, then refresh.</p>
                         </div>
                    ) : showSkeletons ? (
                         Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
                    ) : fShows?.length ? (
                         fShows.map((show) => {
                              const showsStartYear = new Date(show.aired.from).getFullYear();
                              return (
                                   <div className="anime-grid__item" key={show.mal_id}>
                                        <CardEl
                                             refVar={(el) => (cardRefs.current[show.title] = el)}
                                             user={userLoggedIn}
                                             showItself={show}
                                             year={showsStartYear}
                                             altText={show.title}
                                             product={show}
                                        >
                                             <Button
                                                  className="moreInfoBtn"
                                                  variant="primary"
                                                  onClick={() => dispatch(setFocusedShow(show))}
                                             >
                                                  More about this {show?.type == "TV" ? "show" : "movie"}
                                             </Button>
                                        </CardEl>
                                   </div>
                              );
                         })
                    ) : (
                         <div className="empty-results">
                              <h3>No anime matches all of those.</h3>
                              <p>Try removing a genre — or describe what you want to Yumemi AI above.</p>
                         </div>
                    )}
               </div>
          </main>
     );
}

export default Animes;
