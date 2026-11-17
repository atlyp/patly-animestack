import NavDropdown from "react-bootstrap/NavDropdown";
import { useDispatch, useSelector } from "react-redux";
import { ConditionalAvPic } from "./ConditionalAvPic";
import { logOut } from "../redux/userSlice";
import { useNavigate } from "react-router";

export const Avatar = () => {
     const { userLoggedIn } = useSelector((state) => state.userKey);
     const dispatch = useDispatch();
     const navigate = useNavigate();
     // console.log(userLoggedIn);
     return (
          <>
               <NavDropdown
                    style={{ width: "fit-content" }}
                    title={<ConditionalAvPic user={userLoggedIn} />}
                    id="nav-dropdown"
                    className="pfpnav"
               >
                    <NavDropdown.Item
                         eventKey="4.1"
                         onClick={() => {
                              navigate("/myprofile");
                              window.location.reload();
                         }}
                    >
                         My Account
                    </NavDropdown.Item>
                    <NavDropdown.Item eventKey="4.2">Another action</NavDropdown.Item>
                    <NavDropdown.Item eventKey="4.3">Something else here</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item
                         eventKey="4.4"
                         onClick={() => {
                              localStorage.removeItem("loggedIn");
                              localStorage.removeItem("personLoggedIn");

                              dispatch(logOut());
                              navigate("/");
                         }}
                    >
                         Log Out👋🏿
                    </NavDropdown.Item>
               </NavDropdown>
          </>
     );
};
