import { FormEl } from "./FormEl";
import { Alert, Button, FloatingLabel, Form, FormGroup, Spinner } from "react-bootstrap";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { logIn } from "../redux/userSlice";
import { localStorageAdd } from "../../memoryUtils";
import { apiRequest } from "../api";

export const SignIn = ({ setSigningIn }) => {
     const [username, setUsername] = useState("");
     const [password, setPassword] = useState("");
     const [error, setError] = useState("");
     const [loading, setLoading] = useState(false);

     const dispatch = useDispatch();
     const signIn = async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          try {
               const result = await apiRequest("/user/signIn", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
               });
               if (!result.data?._id) {
                    setError("The account server returned an invalid response.");
                    return;
               }
               dispatch(logIn(result.data));
               localStorageAdd("personLoggedIn", result.data._id);
               localStorageAdd("loggedIn", true);
               window.location.reload();
          } catch (e) {
               console.error("Unable to sign in:", e);
               setError(
                    e instanceof Error ? e.message : String(e),
               );
          } finally {
               setLoading(false);
               setPassword("");
               setUsername("");
          }
     };
     return (
          <>
               {!loading && (
                    <FormEl
                         explicitStyles={{ justifySelf: "center", minWidth: "18rem" }}
                         onFormSubmit={signIn}
                         classes="logInForm"
                    >
                         <FormGroup>
                              <FloatingLabel controlId="floatingUsername" label=" Username" className="mb-3">
                                   <Form.Control
                                        onChange={(e) => setUsername(e.target.value)}
                                        type="text"
                                        // id="floatingUsername"
                                        placeholder="@iLoveDogs23"
                                   />
                              </FloatingLabel>
                              <FloatingLabel controlId="floatingPassword" label="Password" className="mb-3">
                                   <Form.Control
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        // id="floatingPassword"
                                        placeholder="Type your password here"
                                   />
                              </FloatingLabel>
                         </FormGroup>
                         <Button type="submit">Log In</Button>
                         <a className="logInSignUp" onClick={() => setSigningIn(false)}>
                              Don't have an account ? Sign up
                         </a>
                    </FormEl>
               )}
               {!loading && error && <Alert variant="danger" className="mx-auto mt-3" style={{ maxWidth: "27rem" }}>{error}</Alert>}
               {loading && (
                    <>
                         <Spinner animation="grow" variant="primary" />
                    </>
               )}
          </>
     );
};
