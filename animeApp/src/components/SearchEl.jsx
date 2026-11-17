import { useEffect, useState } from "react";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import { useDispatch, useSelector } from "react-redux";
import { setGenreFilter, setSearchedShows, setWhatWasSearched } from "../redux/animeSlice";

export function SearchEl() {
     const { shows, whatWasSearched } = useSelector((state) => state.animeKey);
     //  console.log(filteredShows.map((show) => show.titles.filter((title) => title)));
     const dispatch = useDispatch();
     useEffect(() => {
          if (whatWasSearched == "") {
               dispatch(setSearchedShows(shows));
               //   if they didn't search anything
               //   show us all shows
          } else {
               dispatch(setGenreFilter('All'))
               //   otherwise
               dispatch(
                    setSearchedShows(
                         shows.filter((singleShow) => singleShow?.title.toLowerCase().includes(whatWasSearched)),
                    ),
                    //    filter our shows to what they searched
               );
          }
     }, [whatWasSearched]);
     return (
          <>
               <FloatingLabel controlId="floatingSearchInput" label="Search . . " className="mx-5">
                    <Form.Control
                         onChange={(e) => {
                              dispatch(setWhatWasSearched(e.target.value));
                         }}
                         type="text"
                         placeholder=""
                    />
               </FloatingLabel>
          </>
     );
}
