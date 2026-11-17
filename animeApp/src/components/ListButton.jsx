import { useState } from "react";
import { useSelector } from "react-redux";
import { addToMyList, removeFromMyList } from "../api";

// "+ My List" toggle used by AI picks and the details modal.
export const ListButton = ({ show }) => {
     const { userLoggedIn } = useSelector((s) => s.userKey);
     const [inList, setInList] = useState(() => Boolean(userLoggedIn?.myShows?.some((s) => s.mal_id === show.mal_id)));
     const [busy, setBusy] = useState(false);

     const toggle = async () => {
          setBusy(true);
          const next = !inList;
          setInList(next);
          try {
               if (next) await addToMyList(show);
               else await removeFromMyList(show);
          } catch (e) {
               console.error(e);
               setInList(!next);
          } finally {
               setBusy(false);
          }
     };

     return (
          <button type="button" className={`list-btn ${inList ? "is-saved" : ""}`} onClick={toggle} disabled={busy}>
               {inList ? "✓ In My List" : "+ My List"}
          </button>
     );
};
