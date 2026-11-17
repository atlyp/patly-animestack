import { STATUSES, useProgress } from "../progress";

export const ProgressBar = ({ percent, status }) => (
     <div
          className={`progress-track progress-track--${status}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? 0}
     >
          <div className="progress-fill" style={{ width: `${percent ?? (status === "completed" ? 100 : 0)}%` }} />
     </div>
);

// Episode counter + status picker for one saved show.
export const ProgressControls = ({ malId, compact = false }) => {
     const p = useProgress(malId);
     if (!p.saved) return null;
     const isMovie = p.catalogShow?.type === "Movie";

     return (
          <div className={`progress-controls ${compact ? "is-compact" : ""}`}>
               <div className="progress-controls__row">
                    <span className="progress-controls__count">
                         {isMovie ? (p.watched ? "Watched" : "Not watched yet") : `Ep ${p.watched}${p.total ? ` / ${p.total}` : ""}`}
                    </span>
                    {!compact && (
                         <select
                              value={p.status}
                              onChange={(e) => p.setStatus(e.target.value)}
                              aria-label="Watch status"
                              className={`status-select status-select--${p.status}`}
                         >
                              {STATUSES.map((s) => (
                                   <option key={s.value} value={s.value}>
                                        {s.label}
                                   </option>
                              ))}
                         </select>
                    )}
               </div>
               <ProgressBar percent={p.percent} status={p.status} />
               <div className="progress-controls__buttons">
                    {isMovie ? (
                         <button type="button" className="ep-btn ep-btn--wide" onClick={() => (p.watched ? p.reset() : p.setStatus("completed"))}>
                              {p.watched ? "Mark unwatched" : "✓ Mark watched"}
                         </button>
                    ) : (
                         <>
                              <button type="button" className="ep-btn" onClick={p.decrement} disabled={p.watched === 0} aria-label="One episode back">
                                   −
                              </button>
                              <button
                                   type="button"
                                   className="ep-btn ep-btn--wide"
                                   onClick={p.increment}
                                   disabled={Boolean(p.total) && p.watched >= p.total}
                              >
                                   {p.total && p.watched >= p.total ? "✓ Finished" : "+1 episode"}
                              </button>
                         </>
                    )}
               </div>
               {p.error && <p className="progress-controls__error">{p.error}</p>}
          </div>
     );
};
