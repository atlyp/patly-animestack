import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { setAiQuery, setFocusedShow } from "../redux/animeSlice";
import { posterOf, titleOf } from "../api";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const shortcutLabel = isMac ? "⌘K" : "Ctrl K";

// Lightweight fuzzy score: exact substring wins, then in-order letters.
const fuzzy = (text, q) => {
     const t = text.toLowerCase();
     if (t.includes(q)) return 100 - t.indexOf(q);
     let i = 0;
     for (const ch of t) if (ch === q[i]) i++;
     return i === q.length ? 10 : -1;
};

export const CommandPalette = () => {
     const dispatch = useDispatch();
     const navigate = useNavigate();
     const location = useLocation();
     const { shows } = useSelector((s) => s.animeKey);
     const { loggedIn } = useSelector((s) => s.userKey);
     const [open, setOpen] = useState(false);
     const [q, setQ] = useState("");
     const [active, setActive] = useState(0);
     const inputRef = useRef(null);

     useEffect(() => {
          const onKey = (e) => {
               if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                    e.preventDefault();
                    setOpen((o) => !o);
               }
          };
          const onOpen = () => setOpen(true);
          window.addEventListener("keydown", onKey);
          window.addEventListener("yumemi:palette", onOpen);
          return () => {
               window.removeEventListener("keydown", onKey);
               window.removeEventListener("yumemi:palette", onOpen);
          };
     }, []);

     const items = useMemo(() => {
          const query = q.trim().toLowerCase();
          const list = [];
          const matches = query
               ? shows
                      .map((s) => ({ s, score: Math.max(fuzzy(titleOf(s), query), fuzzy(s.title, query)) }))
                      .filter((x) => x.score >= 0)
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 7)
                      .map((x) => x.s)
               : [...shows].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 6);
          matches.forEach((s) => list.push({ kind: "show", show: s }));
          if (query.length >= 3) {
               // descriptions ("cozy fantasy…") lead with AI; title lookups lead with the titles
               const ai = { kind: "ai", label: `Ask Yumemi AI: “${q.trim()}”` };
               if (query.includes(" ") || matches.length === 0) list.unshift(ai);
               else list.push(ai);
          }
          return list;
     }, [q, shows]);

     useEffect(() => setActive(0), [q]);

     const choose = (item) => {
          if (!item) return;
          setOpen(false);
          setQ("");
          if (item.kind === "ai") {
               if (location.pathname !== "/dashboard") navigate("/dashboard");
               dispatch(setAiQuery(q.trim()));
          } else {
               dispatch(setFocusedShow(item.show));
          }
     };

     if (!loggedIn) return null;

     return (
          <Modal
               show={open}
               onHide={() => setOpen(false)}
               onEntered={() => inputRef.current?.focus()}
               className="palette"
               aria-label="Quick search"
          >
               <div className="palette__input">
                    <span aria-hidden="true">⌕</span>
                    <input
                         ref={inputRef}
                         value={q}
                         onChange={(e) => setQ(e.target.value)}
                         placeholder="Search titles, or describe a vibe…"
                         onKeyDown={(e) => {
                              if (e.key === "ArrowDown") {
                                   e.preventDefault();
                                   setActive((a) => Math.min(a + 1, items.length - 1));
                              } else if (e.key === "ArrowUp") {
                                   e.preventDefault();
                                   setActive((a) => Math.max(a - 1, 0));
                              } else if (e.key === "Enter") {
                                   e.preventDefault();
                                   choose(items[active]);
                              }
                         }}
                    />
                    <kbd>esc</kbd>
               </div>
               <ul className="palette__list" role="listbox">
                    {!q && <li className="palette__section">Top rated</li>}
                    {items.map((item, i) => (
                         <li
                              key={item.kind === "ai" ? "ai" : item.show.mal_id}
                              role="option"
                              aria-selected={i === active}
                              className={`palette__item ${i === active ? "is-active" : ""} ${item.kind === "ai" ? "palette__item--ai" : ""}`}
                              onMouseEnter={() => setActive(i)}
                              onClick={() => choose(item)}
                         >
                              {item.kind === "ai" ? (
                                   <>
                                        <span className="palette__ai-icon">✦</span>
                                        <span>{item.label}</span>
                                   </>
                              ) : (
                                   <>
                                        <img src={posterOf(item.show)} alt="" />
                                        <span className="palette__title">{titleOf(item.show)}</span>
                                        <span className="palette__meta">
                                             ★ {item.show.score} · {item.show.year || new Date(item.show.aired?.from).getFullYear()}
                                        </span>
                                   </>
                              )}
                         </li>
                    ))}
                    {items.length === 0 && <li className="palette__empty">No matches — try describing a vibe instead.</li>}
               </ul>
          </Modal>
     );
};
