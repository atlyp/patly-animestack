import { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useDispatch, useSelector } from "react-redux";
import { mergeShows, setFocusedShow } from "../redux/animeSlice";
import { aiCatchUp, getAnime, posterOf, titleOf } from "../api";
import { ListButton } from "./ListButton";
import { untilText } from "../catalog";

// Turn the catalog's embed URL into a muted, non-autoplaying player URL.
const trailerSrc = (show) => {
     const raw = show?.trailer?.embed_url;
     if (!raw) return null;
     try {
          const url = new URL(raw);
          url.searchParams.delete("autoplay");
          url.searchParams.set("rel", "0");
          return url.toString();
     } catch {
          return null;
     }
};

const statusLine = (show) => {
     if (show.status === "Currently Airing") return show.type === "TV" ? "Currently airing" : "Its TV series is still airing";
     return show.status;
};

const CatchUp = ({ show }) => {
     const total = show.episodes || null;
     // start from where the viewer's progress says they are
     const watched = useSelector(
          (s) => s.userKey.userLoggedIn?.myShows?.find((x) => x.mal_id === show.mal_id)?.episodesWatched,
     );
     const [episode, setEpisode] = useState(() => Math.max(1, watched || 1));
     const [state, setState] = useState({ status: "idle" });

     const go = async (e) => {
          e.preventDefault();
          setState({ status: "loading" });
          try {
               setState({ status: "done", ...(await aiCatchUp(show.mal_id, episode)) });
          } catch (err) {
               setState({ status: "error", message: err instanceof TypeError ? "Can't reach the Yumemi server." : err.message });
          }
     };

     return (
          <section className="catchup">
               <div className="catchup__head">
                    <span className="ai-badge">✦ Spoiler-free catch-up</span>
                    <p>Coming back after a break? Get a recap that stops exactly where you did.</p>
               </div>
               <form className="catchup__form" onSubmit={go}>
                    <label htmlFor="catchup-ep">I've watched through episode</label>
                    <input
                         id="catchup-ep"
                         type="number"
                         min={1}
                         max={total || undefined}
                         value={episode}
                         onChange={(e) => setEpisode(Math.max(1, Math.min(total || 9999, Number(e.target.value) || 1)))}
                    />
                    {total && <span className="catchup__of">of {total}</span>}
                    <button type="submit" className="ghost-btn" disabled={state.status === "loading"}>
                         {state.status === "loading" ? "Recapping…" : "Catch me up"}
                    </button>
               </form>
               {state.status === "done" && (
                    <div className="catchup__result">
                         <p>{state.summary}</p>
                         {state.note && <small>{state.note}</small>}
                         {state.source === "ai" && !state.confident && (
                              <small>Kept intentionally vague around episode boundaries to stay spoiler-safe.</small>
                         )}
                    </div>
               )}
               {state.status === "error" && <p className="ai-finder__error">{state.message}</p>}
          </section>
     );
};

// Streaming services (from AniList) + when the next episode airs.
const WatchOn = ({ show, loading }) => {
     const next = show.nextAiring;
     const links = show.streaming || [];
     return (
          <section className="watch-on" aria-label="Where to watch">
               <h3>Where to watch</h3>
               {links.length ? (
                    <div className="watch-on__list">
                         {links.map((l) => (
                              <a key={l.name} className="watch-on__link" href={l.url} target="_blank" rel="noopener noreferrer">
                                   ▶ {l.name}
                              </a>
                         ))}
                    </div>
               ) : (
                    <p className="show-modal__note">{loading ? "Checking streaming services…" : "No streaming links listed yet."}</p>
               )}
               {links.length > 0 && <small>Availability depends on your country.</small>}
               {next?.at && (
                    <span className="next-ep">
                         ◷ Episode {next.episode} airs {untilText(next.at, Date.now())} ·{" "}
                         {new Date(next.at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
               )}
          </section>
     );
};

export const ShowModal = () => {
     const dispatch = useDispatch();
     const show = useSelector((s) => s.animeKey.focusedShow);
     const [last, setLast] = useState(null);
     const [detailsFor, setDetailsFor] = useState(null);
     // keep content rendered while the modal fades out
     useEffect(() => {
          if (show) setLast(show);
     }, [show]);
     // fetch the full, current details (streaming links, next episode, trailer…)
     const focusedId = show?.mal_id;
     useEffect(() => {
          if (!focusedId) return;
          let live = true;
          setDetailsFor(null);
          getAnime(focusedId)
               .then(({ data }) => {
                    if (!live) return;
                    dispatch(mergeShows([data]));
                    setDetailsFor(focusedId);
               })
               .catch(() => live && setDetailsFor(focusedId));
          return () => {
               live = false;
          };
     }, [focusedId]);
     const s = show || last;
     const close = () => dispatch(setFocusedShow(null));
     if (!s) return null;

     const trailer = trailerSrc(s);
     const altTitle = s.titles?.find((t) => t.type === "Japanese")?.title || s.title_japanese;
     const tags = [...(s.genres || []), ...(s.themes || [])].map((g) => g.name);
     const year = s.year || new Date(s.aired?.from).getFullYear();

     return (
          <Modal show={Boolean(show)} onHide={close} size="lg" centered className="show-modal" aria-labelledby="show-modal-title">
               <button type="button" className="show-modal__close" onClick={close} aria-label="Close">
                    ×
               </button>
               <div className="show-modal__hero">
                    {trailer ? (
                         <div className="show-modal__trailer">
                              <iframe
                                   key={s.mal_id}
                                   src={trailer}
                                   title={`${titleOf(s)} trailer`}
                                   allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                                   allowFullScreen
                              />
                         </div>
                    ) : (
                         <div className="show-modal__backdrop" style={{ backgroundImage: `url(${posterOf(s)})` }} />
                    )}
               </div>
               <Modal.Body>
                    <div className="show-modal__top">
                         <img className="show-modal__poster" src={posterOf(s)} alt="" />
                         <div>
                              <h2 id="show-modal-title">{titleOf(s)}</h2>
                              {altTitle && <p className="show-modal__alt">{altTitle}</p>}
                              <div className="show-modal__facts">
                                   <span className="fact fact--score">★ {s.score ?? "–"}</span>
                                   <span className="fact">{s.type}</span>
                                   <span className="fact">{year}</span>
                                   {s.episodes && <span className="fact">{s.episodes} eps</span>}
                                   <span className="fact">{s.duration}</span>
                                   <span className="fact">{statusLine(s)}</span>
                              </div>
                              <div className="show-modal__actions">
                                   <ListButton key={s.mal_id} show={s} />
                                   {!trailer && <span className="show-modal__note">No trailer available</span>}
                              </div>
                         </div>
                    </div>

                    <WatchOn show={s} loading={detailsFor !== s.mal_id} />

                    <p className="show-modal__synopsis">{s.synopsis}</p>

                    <div className="tag-row">
                         {tags.map((t) => (
                              <span key={t} className="tag">
                                   {t}
                              </span>
                         ))}
                    </div>

                    <dl className="show-modal__details">
                         {s.studios?.length > 0 && (
                              <>
                                   <dt>Studio</dt>
                                   <dd>{s.studios.map((x) => x.name).join(", ")}</dd>
                              </>
                         )}
                         {s.producers?.length > 0 && (
                              <>
                                   <dt>Producers</dt>
                                   <dd>{s.producers.map((x) => x.name).join(", ")}</dd>
                              </>
                         )}
                         {s.rating && (
                              <>
                                   <dt>Rating</dt>
                                   <dd>{s.rating}</dd>
                              </>
                         )}
                         {s.background && (
                              <>
                                   <dt>Background</dt>
                                   <dd>{s.background}</dd>
                              </>
                         )}
                    </dl>

                    {s.type !== "Movie" && ((s.episodes || 0) > 1 || s.airing) && <CatchUp key={s.mal_id} show={s} />}
               </Modal.Body>
          </Modal>
     );
};
