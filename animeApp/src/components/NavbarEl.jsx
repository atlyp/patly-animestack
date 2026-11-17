import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useDispatch, useSelector } from "react-redux";
import { setGenreFilter, setWayToSort } from "../redux/animeSlice";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";

import { useLocation } from "react-router";
import { SearchEl } from "./SearchEl";
import { shortcutLabel } from "./CommandPalette";

export const NavbarEl = () => {
     const location = useLocation();
     // console.log(location.pathname);
     const { loggedIn } = useSelector((state) => state.userKey);

     const dispatch = useDispatch();

     const handleGenre = (genre) => {
          return dispatch(setGenreFilter(genre));
     };
     const handleSort = (method) => {
          return dispatch(setWayToSort(method));
     };
     return (
          <Navbar collapseOnSelect expand="lg" className="app-navbar">
               <Container className="app-navbar__container">
                    <Navbar.Brand href="/dashboard" className="navLogoContainer">
                         <Logo size={34} />
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                         <Navbar.Collapse id="responsive-navbar-nav">
                              <Nav className="me-auto">
                                   <Nav.Link href="/dashboard" className="browse-link">
                                        Browse
                                   </Nav.Link>
                              {location.pathname == "/dashboard" && (
                                   <>
                                        <SearchEl />
                                        <NavDropdown title="Pick a Genre">
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  All
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Adventure
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Award Winning
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Drama
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Fantasy
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Action
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Mystery
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Supernatural
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Sci-Fi
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Suspense
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Comedy
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Romance
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleGenre(e.target.text)}>
                                                  Sports
                                             </NavDropdown.Item>
                                        </NavDropdown>
                                        <NavDropdown title="Sort By . . . ">
                                             <NavDropdown.Item onClick={(e) => handleSort(e.target.text)}>
                                                  A-Z
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleSort(e.target.text)}>
                                                  Z-A
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleSort(e.target.text)}>
                                                  Newest To Oldest
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleSort(e.target.text)}>
                                                  Oldest To Newest
                                             </NavDropdown.Item>
                                             <NavDropdown.Item onClick={(e) => handleSort(e.target.text)}>
                                                  Score
                                             </NavDropdown.Item>
                                        </NavDropdown>
                                   </>
                              )}
                         </Nav>
                         <Nav>
                              {loggedIn && (
                                   <button
                                        type="button"
                                        className="palette-trigger"
                                        onClick={() => window.dispatchEvent(new Event("yumemi:palette"))}
                                   >
                                        Quick find <kbd>{shortcutLabel}</kbd>
                                   </button>
                              )}
                              {loggedIn && (
                                   <Nav.Link href="/myprofile" className="mylist-link">
                                        My List
                                   </Nav.Link>
                              )}
                         </Nav>
                    </Navbar.Collapse>
                    {loggedIn ? <Avatar /> : ""}
               </Container>
          </Navbar>
     );
};
