import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { aiBecause, posterOf, titleOf } from "../api";
import { setFocusedShow } from "../redux/animeSlice";
import { ListButton } from "./ListButton";

export const BecauseYouSaved = ({ savedIds, avoidIds = [] }) => {
     const dispatch = useDispatch();
     const { shows } = useSelector((s) => s.animeKey);
     const [state, setState] = useState({ status: "loading" });
     const key = [...savedIds].sort().join(",") + "|" + [...avoidIds].sort().join(",");

     useEffect(() => {
          if (!savedIds.length) return;
          let live = true;
          setState({ status: "loading" });
          aiBecause(savedIds, avoidIds)
               .then((data) => live && setState({ status: "done", ...data }))
               .catch((e) => live && setState({ status: "error", message: e.message }));
          return () => {
               live = false;
          };
     }, [key]);

     if (!savedIds.length) return null;
     const byId = new Map(shows.map((s) => [s.mal_id, s]));

     return (
          <section className="because">
               <div className="because__head">
                    <span className="ai-badge">✦ For you</span>
                    <h2 className="profile-section-title">Because you saved…</h2>
                    {state.intro && <p>{state.intro}</p>}
               </div>
               {state.status === "loading" && (
                    <div className="pick-grid">
                         {[0, 1, 2, 3].map((i) => (
                              <div key={i} className="pick-card pick-card--skeleton">
                                   <div className="skeleton skeleton--poster" />
                                   <div className="pick-card__body">
                                        <div className="skeleton skeleton--line" />
                                        <div className="skeleton skeleton--line short" />
                                   </div>
                              </div>
                         ))}
                    </div>
               )}
               {state.status === "error" && <p className="ai-finder__error">Couldn't load recommendations: {state.message}</p>}
               {state.status === "done" && (
                    <div className="pick-grid">
                         {state.picks.map((pick, i) => {
                              const show = byId.get(pick.mal_id);
                              if (!show) return null;
                              return (
                                   <article key={pick.mal_id} className="pick-card" style={{ animationDelay: `${i * 80}ms` }}>
                                        <button type="button" className="pick-card__poster" onClick={() => dispatch(setFocusedShow(show))}>
                                             <img src={posterOf(show)} alt={titleOf(show)} />
                                        </button>
                                        <div className="pick-card__body">
                                             <h3>{titleOf(show)}</h3>
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
               )}
          </section>
     );
};
