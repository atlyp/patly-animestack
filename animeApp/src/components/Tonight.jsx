import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTonight, posterOf, titleOf } from "../api";
import { mergeShows, setFocusedShow } from "../redux/animeSlice";
import { useProgress } from "../progress";
import { untilText } from "../catalog";

const dayTime = (at) =>
     new Date(at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });

const TonightTile = ({ item, now }) => {
     const dispatch = useDispatch();
     const p = useProgress(item.mal_id);
     const show = p.catalogShow || item.show;
     // use live progress so marking an episode updates the badge immediately
     const watched = p.saved ? p.watched : item.watched;
     const behind = item.latestAired == null ? 0 : Math.max(0, item.latestAired - watched);
     const isNew = item.newToday && behind > 0;
     const nextToWatch = watched + 1;

     let badge;
     if (isNew) badge = { cls: "is-new", text: `New · Ep ${item.latestAired} is out` };
     else if (behind > 0) badge = { cls: "is-behind", text: `${behind} episode${behind === 1 ? "" : "s"} to catch up` };
     else if (item.nextAt && item.nextEpisode === 1) badge = { cls: "is-soon", text: `Premieres ${untilText(item.nextAt, now)}` };
     else if (item.nextAt) badge = { cls: "is-soon", text: `Ep ${item.nextEpisode} ${untilText(item.nextAt, now)}` };
     else badge = { cls: "is-soon", text: "Airing · schedule TBA" };

     return (
          <article className={`tonight-tile ${isNew ? "tonight-tile--new" : ""}`}>
               <button type="button" className="tonight-tile__art" onClick={() => dispatch(setFocusedShow(show))}>
                    <img src={posterOf(show)} alt="" loading="lazy" />
               </button>
               <div className="tonight-tile__body">
                    <span className={`tonight-badge ${badge.cls}`}>{badge.text}</span>
                    <h3 title={titleOf(show)}>{titleOf(show)}</h3>
                    <p className="tonight-tile__meta">
                         {item.latestAired != null && <>Seen {watched} of {item.latestAired} aired</>}
                         {item.nextAt && behind === 0 && item.nextEpisode > 1 && <> · next {dayTime(item.nextAt)}</>}
                    </p>
                    <div className="tonight-tile__actions">
                         {behind > 0 && p.saved && (
                              <button type="button" className="ep-btn ep-btn--wide" onClick={p.increment}>
                                   ✓ Watched ep {nextToWatch}
                              </button>
                         )}
                         <button type="button" className="ghost-btn" onClick={() => dispatch(setFocusedShow(show))}>
                              Where to watch
                         </button>
                    </div>
                    {p.error && <p className="progress-controls__error">{p.error}</p>}
               </div>
          </article>
     );
};

export const Tonight = ({ onBrowseAiring }) => {
     const dispatch = useDispatch();
     const { loggedIn, userLoggedIn } = useSelector((s) => s.userKey);
     const myShows = userLoggedIn?.myShows || [];
     const [state, setState] = useState({ status: "idle", items: [] });
     const [now, setNow] = useState(Date.now());
     // refetch when shows are added/removed or change status (not on every +1)
     const key = myShows.map((x) => `${x.mal_id}:${x.status}`).sort().join(",");

     useEffect(() => {
          if (!loggedIn || !myShows.length) return;
          let live = true;
          setState((s) => ({ ...s, status: s.items.length ? "refreshing" : "loading" }));
          getTonight()
               .then(({ data }) => {
                    if (!live) return;
                    dispatch(mergeShows(data.map((x) => x.show).filter(Boolean)));
                    setState({ status: "done", items: data });
               })
               .catch((e) => live && setState({ status: "error", items: [], message: e.message }));
          return () => {
               live = false;
          };
     }, [loggedIn, key]);

     useEffect(() => {
          const t = setInterval(() => setNow(Date.now()), 30000);
          return () => clearInterval(t);
     }, []);

     if (!loggedIn) return null;
     const newCount = state.items.filter((x) => x.newToday).length;

     return (
          <section className="tonight" aria-labelledby="tonight-title">
               <div className="tonight__head">
                    <div>
                         <span className="section-kicker">Your airing shows</span>
                         <h2 id="tonight-title">
                              {newCount ? (
                                   <>
                                        Tonight: <span>{newCount} new episode{newCount === 1 ? "" : "s"}</span>
                                   </>
                              ) : (
                                   "Tonight on your list"
                              )}
                         </h2>
                    </div>
               </div>

               {state.status === "loading" && (
                    <div className="tonight__row" aria-busy="true">
                         {[0, 1, 2].map((i) => (
                              <div key={i} className="tonight-tile tonight-tile--skeleton">
                                   <div className="skeleton skeleton--poster" />
                              </div>
                         ))}
                    </div>
               )}
               {state.status === "error" && <p className="ai-finder__error">Couldn't check today's episodes: {state.message}</p>}
               {(state.status === "done" || state.status === "refreshing") && state.items.length > 0 && (
                    <div className="tonight__row">
                         {state.items.map((item) => (
                              <TonightTile key={item.mal_id} item={item} now={now} />
                         ))}
                    </div>
               )}
               {(!myShows.length || (state.status === "done" && !state.items.length)) && (
                    <div className="tonight__empty">
                         <p>
                              {myShows.length
                                   ? "None of your saved shows are airing right now."
                                   : "Save a show that's airing this season and its new episodes show up here, with a countdown to the next one."}
                         </p>
                         <button type="button" className="ghost-btn" onClick={onBrowseAiring}>
                              Browse what's airing now →
                         </button>
                    </div>
               )}
          </section>
     );
};
