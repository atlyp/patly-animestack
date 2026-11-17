import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Button } from "react-bootstrap";
import { localGet, signInOffMem } from "../../memoryUtils";
import { useDispatch } from "react-redux";
import { logIn } from "../redux/userSlice";
import { useNavigate } from "react-router";
import { logOut } from "../redux/userSlice.js";
import { useState } from "react";
import { ChangePfp } from "../components/ChangePfp.jsx";
import { BecauseYouSaved } from "../components/BecauseYouSaved.jsx";
import { TasteCard } from "../components/TasteCard.jsx";
import { clearSession, posterOf, removeFromMyList, titleOf } from "../api";
import { ProgressControls } from "../components/ProgressControls.jsx";
import { STATUSES, statusLabel } from "../progress";
import { setFocusedShow } from "../redux/animeSlice";
export const MyProfile = () => {
     const { userLoggedIn } = useSelector((state) => state.userKey);
     const { shows } = useSelector((state) => state.animeKey);
     // console.log(userLoggedIn);
     const { username, myShows } = userLoggedIn;
     const dispatch = useDispatch();
     const navigate = useNavigate();
     useEffect(() => {
          if (localGet("loggedIn")) {
               // console.log("someone logged in");
               signInOffMem(dispatch, logIn, navigate);
               navigate("/myprofile");
               //   if we were already logged in- send us to- our profile
          } else {
               navigate("/");
          }
     }, []);
     // KEEP logged in logic ^^
     const handleLogOut = () => {
          dispatch(logOut());
          clearSession();
          navigate("/");
     };
     const removeShowFromMyList = async (theShow) => {
          try {
               await removeFromMyList(theShow);
               window.location.reload();
          } catch (e) {
               console.error("Unable to remove show from your list:", e);
          }
     };
     const [tab, setTab] = useState("all");
     const list = myShows || [];
     const counts = Object.fromEntries(STATUSES.map((st) => [st.value, list.filter((x) => (x.status ?? "plan") === st.value).length]));
     const visible = (tab === "all" ? list : list.filter((x) => (x.status ?? "plan") === tab))
          .slice()
          .sort((x, y) => new Date(y.progressUpdatedAt || 0) - new Date(x.progressUpdatedAt || 0));
     const episodesWatched = list.reduce((n, x) => n + (x.episodesWatched || 0), 0);

     return (
          <>
               <div className="profile-page">
                    <section className="profile-head">
                         <ChangePfp user={userLoggedIn} />
                         <div>
                              <span className="eyebrow">Your profile</span>
                              <h1>
                                   Hello, <span>@{username}</span>
                              </h1>
                              <p className="profile-stats">
                                   <span><strong>{list.length}</strong> saved</span>
                                   <span><strong>{episodesWatched}</strong> episodes watched</span>
                                   <span><strong>{counts.completed}</strong> completed</span>
                              </p>
                              <Button variant="outline-light" onClick={handleLogOut}>
                                   Log Out
                              </Button>
                         </div>
                    </section>
                    <section>
                         {myShows && myShows.length ? (
                              <>
                                   <h2 className="profile-section-title">Your list</h2>
                                   <div className="status-tabs" role="tablist" aria-label="Filter your list">
                                        {[{ value: "all", label: "All" }, ...STATUSES].map((st) => (
                                             <button
                                                  key={st.value}
                                                  type="button"
                                                  role="tab"
                                                  aria-selected={tab === st.value}
                                                  className={`status-tab ${tab === st.value ? "is-on" : ""}`}
                                                  onClick={() => setTab(st.value)}
                                             >
                                                  {st.label}
                                                  <span>{st.value === "all" ? list.length : counts[st.value]}</span>
                                             </button>
                                        ))}
                                   </div>
                                   {visible.length ? (
                                        <div className="mylist-grid">
                                             {visible.map((show) => (
                                                  <article key={show.mal_id} className="mylist-card">
                                                       <button
                                                            type="button"
                                                            className="mylist-card__art"
                                                            onClick={() => {
                                                                 const full = shows.find((x) => x.mal_id === show.mal_id) || show.snapshot;
                                                                 if (full) dispatch(setFocusedShow(full));
                                                            }}
                                                       >
                                                            <img src={posterOf(show)} alt="" loading="lazy" />
                                                       </button>
                                                       <div className="mylist-card__body">
                                                            <h3>{titleOf(shows.find((x) => x.mal_id === show.mal_id) || show)}</h3>
                                                            <ProgressControls malId={show.mal_id} />
                                                            <button
                                                                 type="button"
                                                                 className="mylist-card__remove"
                                                                 onClick={() => removeShowFromMyList(show)}
                                                            >
                                                                 Remove from list
                                                            </button>
                                                       </div>
                                                  </article>
                                             ))}
                                        </div>
                                   ) : (
                                        <div className="empty-results">
                                             <h3>Nothing marked “{statusLabel(tab)}” yet.</h3>
                                        </div>
                                   )}
                              </>
                         ) : (
                              <div className="empty-results">
                                   <h3>Your list is empty… for now.</h3>
                                   <p>Head to Browse and tap + on anything that catches your eye.</p>
                              </div>
                         )}
                    </section>
                    {myShows?.length > 0 && (
                         <>
                              <BecauseYouSaved
                                   savedIds={list.filter((x) => x.status !== "dropped").map((x) => x.mal_id)}
                                   avoidIds={list.filter((x) => x.status === "dropped").map((x) => x.mal_id)}
                              />
                              <TasteCard username={username} myShows={myShows} />
                         </>
                    )}
               </div>
          </>
     );
};
