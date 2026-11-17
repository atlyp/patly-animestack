import { useDispatch, useSelector } from "react-redux";
import { posterOf, titleOf } from "../api";
import { setFocusedShow } from "../redux/animeSlice";
import { useProgress } from "../progress";
import { ProgressBar } from "./ProgressControls";

const ContinueTile = ({ malId }) => {
     const dispatch = useDispatch();
     const p = useProgress(malId);
     if (!p.saved || !p.catalogShow) return null;
     const show = p.catalogShow;
     const nextEp = p.watched + 1;

     return (
          <article className="continue-tile">
               <button type="button" className="continue-tile__art" onClick={() => dispatch(setFocusedShow(show))}>
                    <img src={posterOf(show)} alt="" />
                    <span className="continue-tile__next">Up next · Ep {nextEp}</span>
               </button>
               <div className="continue-tile__body">
                    <h3 title={titleOf(show)}>{titleOf(show)}</h3>
                    <span className="continue-tile__count">
                         {p.watched} of {p.total ?? "?"} episodes
                    </span>
                    <ProgressBar percent={p.percent} status={p.status} />
                    <div className="continue-tile__actions">
                         <button type="button" className="ep-btn ep-btn--wide" onClick={p.increment}>
                              ✓ Watched ep {nextEp}
                         </button>
                         <button type="button" className="ghost-btn" onClick={() => dispatch(setFocusedShow(show))}>
                              Recap
                         </button>
                    </div>
                    {p.error && <p className="progress-controls__error">{p.error}</p>}
               </div>
          </article>
     );
};

export const ContinueWatching = () => {
     const myShows = useSelector((s) => s.userKey.userLoggedIn?.myShows) || [];
     const watching = myShows
          .filter((s) => s.status === "watching")
          .sort((a, b) => new Date(b.progressUpdatedAt || 0) - new Date(a.progressUpdatedAt || 0));
     if (!watching.length) return null;

     return (
          <section className="continue" aria-labelledby="continue-title">
               <div className="continue__head">
                    <span className="section-kicker">Pick up where you left off</span>
                    <h2 id="continue-title">Continue watching</h2>
               </div>
               <div className="continue__row">
                    {watching.map((s) => (
                         <ContinueTile key={s.mal_id} malId={s.mal_id} />
                    ))}
               </div>
          </section>
     );
};
