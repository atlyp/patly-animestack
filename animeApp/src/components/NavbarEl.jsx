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
import { GENRES, SORTS } from "../catalog";

export const NavbarEl = () => {
     const location = useLocation();
     const { loggedIn } = useSelector((state) => state.userKey);
     const dispatch = useDispatch();

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
                                             {["All", ...GENRES].map((genre) => (
                                                  <NavDropdown.Item key={genre} onClick={() => dispatch(setGenreFilter(genre))}>
                                                       {genre}
                                                  </NavDropdown.Item>
                                             ))}
                                        </NavDropdown>
                                        <NavDropdown title="Sort By . . . ">
                                             {Object.keys(SORTS).map((label) => (
                                                  <NavDropdown.Item key={label} onClick={() => dispatch(setWayToSort(label))}>
                                                       {label}
                                                  </NavDropdown.Item>
                                             ))}
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
