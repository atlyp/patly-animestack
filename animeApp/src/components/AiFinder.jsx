import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { aiFind, posterOf, titleOf } from "../api";
import { setAiQuery, setFocusedShow } from "../redux/animeSlice";
import { ListButton } from "./ListButton";

const MOODS = [
     { emoji: "😭", label: "Cry", query: "an emotional story that will make me cry, beautiful and bittersweet" },
     { emoji: "🔥", label: "Hype", query: "pure hype — intense fights, big moments, adrenaline" },
     { emoji: "☕", label: "Cozy", query: "something cozy and wholesome to relax with, low stakes, not sad" },
     { emoji: "🧠", label: "Mind-bender", query: "a smart mind-bending mystery with twists that keeps me guessing" },
     { emoji: "😂", label: "Laugh", query: "something genuinely funny that will make me laugh out loud" },
     { emoji: "💘", label: "Romance", query: "a sweet romance with great chemistry" },
];

const EXAMPLES = [
     "a cozy fantasy with found family, nothing too sad…",
     "short and intense, I can binge it this weekend…",
     "like a heist movie but with superpowers…",
     "a sports underdog story that'll get me hyped…",
];

export const AiFinder = () => {
     const dispatch = useDispatch();
     const { shows, aiQuery } = useSelector((s) => s.animeKey);
     const { userLoggedIn } = useSelector((s) => s.userKey);
     const [query, setQuery] = useState("");
     const [state, setState] = useState({ status: "idle" }); // idle | loading | done | error
     const [placeholder, setPlaceholder] = useState(0);
     const sectionRef = useRef(null);
     const byId = new Map(shows.map((s) => [s.mal_id, s]));

     useEffect(() => {
          const t = setInterval(() => setPlaceholder((p) => (p + 1) % EXAMPLES.length), 3500);
          return () => clearInterval(t);
     }, []);

     const run = async (text) => {
          const q = text.trim();
          if (!q) return;
          setQuery(q);
          setState({ status: "loading" });
          try {
               const saved = (userLoggedIn?.myShows || []).map((s) => s.mal_id);
               const data = await aiFind(q, saved);
               setState({ status: "done", ...data });
          } catch (e) {
               setState({
                    status: "error",
                    message:
                         e instanceof TypeError
                              ? "Can't reach the Yumemi API. Check that the server is available."
                              : e.message,
               });
          }
     };

     // A query sent from the ⌘K palette
     useEffect(() => {
          if (!aiQuery) return;
          run(aiQuery);
          dispatch(setAiQuery(""));
          sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
     }, [aiQuery]);

     const surprise = () => {
          const good = shows.filter((s) => (s.score || 0) >= 8);
          const pool = good.length ? good : shows;
          if (pool.length) dispatch(setFocusedShow(pool[Math.floor(Math.random() * pool.length)]));
     };

     return (
          <section className="ai-finder" ref={sectionRef} aria-labelledby="ai-finder-title">
               <div className="ai-finder__glow" aria-hidden="true" />
               <div className="ai-finder__head">
                    <span className="ai-badge">✦ Yumemi AI</span>
                    <h2 id="ai-finder-title">Describe it. We'll find it.</h2>
                    <p>Tell us the vibe, the mood, or a show you loved — in your own words.</p>
               </div>

               <form
                    className="ai-finder__form"
                    onSubmit={(e) => {
                         e.preventDefault();
                         run(query);
                    }}
               >
                    <textarea
                         value={query}
                         onChange={(e) => setQuery(e.target.value)}
                         onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                   e.preventDefault();
                                   run(query);
                              }
                         }}
                         placeholder={EXAMPLES[placeholder]}
                         rows={2}
                         maxLength={500}
                         aria-label="Describe what you want to watch"
                    />
                    <button type="submit" className="ai-finder__go" disabled={state.status === "loading" || !query.trim()}>
                         {state.status === "loading" ? <span className="dots">Finding</span> : "Find my show →"}
                    </button>
               </form>

               <div className="mood-row" role="group" aria-label="Pick a mood">
                    {MOODS.map((m) => (
                         <button key={m.label} type="button" className="mood-chip" onClick={() => run(m.query)}>
                              <span aria-hidden="true">{m.emoji}</span> {m.label}
                         </button>
                    ))}
                    <button type="button" className="mood-chip mood-chip--dice" onClick={surprise}>
                         <span aria-hidden="true">🎲</span> Surprise me
                    </button>
               </div>

               {state.status === "loading" && (
                    <div className="pick-grid" aria-busy="true">
                         {[0, 1, 2, 3].map((i) => (
                              <div key={i} className="pick-card pick-card--skeleton">
                                   <div className="skeleton skeleton--poster" />
                                   <div className="pick-card__body">
                                        <div className="skeleton skeleton--line" />
                                        <div className="skeleton skeleton--line short" />
                                        <div className="skeleton skeleton--line" />
                                   </div>
                              </div>
                         ))}
                    </div>
               )}

               {state.status === "error" && <p className="ai-finder__error" role="alert">{state.message}</p>}

               {state.status === "done" && (
                    <div className="ai-results" aria-live="polite">
                         <p className="ai-results__intro">{state.intro}</p>
                         <div className="pick-grid">
                              {state.picks.map((pick, i) => {
                                   const show = byId.get(pick.mal_id);
                                   if (!show) return null;
                                   return (
                                        <article key={pick.mal_id} className="pick-card" style={{ animationDelay: `${i * 80}ms` }}>
                                             <button type="button" className="pick-card__poster" onClick={() => dispatch(setFocusedShow(show))}>
                                                  <img src={posterOf(show)} alt={titleOf(show)} />
                                                  <span className="pick-card__rank">#{i + 1}</span>
                                             </button>
                                             <div className="pick-card__body">
                                                  <h3>{titleOf(show)}</h3>
                                                  <span className="pick-card__meta">
                                                       ★ {show.score} · {show.type === "Movie" ? "Movie" : `${show.episodes ?? "?"} eps`} · {show.year || new Date(show.aired?.from).getFullYear()}
                                                  </span>
                                                  <p>{pick.reason}</p>
                                                  <div className="pick-card__actions">
                                                       <button type="button" className="ghost-btn" onClick={() => dispatch(setFocusedShow(show))}>
                                                            Details
                                                       </button>
                                                       <ListButton show={show} />
                                                  </div>
                                             </div>
                                        </article>
                                   );
                              })}
                         </div>
                         <p className="ai-results__source">
                              {state.source === "claude"
                                   ? "✦ Picked by Claude"
                                   : "Matched by Yumemi's offline mood matcher — connect Claude on the server for smarter, free-form picks."}
                         </p>
                    </div>
               )}
          </section>
     );
};
