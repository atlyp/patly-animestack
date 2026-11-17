import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import { useDispatch, useSelector } from "react-redux";
import { setWhatWasSearched } from "../redux/animeSlice";

// Typing here searches the whole catalog (Animes.jsx runs the search once typing pauses).
export function SearchEl() {
     const { whatWasSearched } = useSelector((state) => state.animeKey);
     const dispatch = useDispatch();
     return (
          <FloatingLabel controlId="floatingSearchInput" label="Search every anime . ." className="mx-5">
               <Form.Control
                    value={whatWasSearched}
                    onChange={(e) => dispatch(setWhatWasSearched(e.target.value))}
                    type="search"
                    placeholder=""
               />
          </FloatingLabel>
     );
}
