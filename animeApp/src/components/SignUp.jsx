import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import { bothMatch } from "../../utilities";
import { Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router";
import { saveSession, signUp as signUpRequest } from "../api";

export const SignUp = ({ setSigningIn }) => {
     const [validated, setValidated] = useState(false);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState("");
     const [userSigningUp, setUserSigningUp] = useState({
          email: "",
          confirmEmail: "",
          password: "",
          confirmPassword: "",
          username: "",
     });
     const navigate = useNavigate();

     const signUp = async () => {
          setLoading(true);
          setError("");
          try {
               if (!bothMatch(userSigningUp.email, userSigningUp.confirmEmail)) {
                    return window.alert("Your EMAILS DO NOT match");
               }
               if (!bothMatch(userSigningUp.password, userSigningUp.confirmPassword)) {
                    return window.alert("Your PASSWORDS DO NOT match");
               }
               const data = await signUpRequest({
                    email: userSigningUp.email,
                    password: userSigningUp.password,
                    username: userSigningUp.username,
                    profileImgPath: "none",
               });
               if (!data.data?._id || !data.token) throw new Error("The account server returned an invalid response.");
               saveSession(data.token);
               navigate("/dashboard");
          } catch (e) {
               console.error("Unable to create account:", e);
               setError(e instanceof Error ? e.message : String(e));
          } finally {
               setLoading(false);
          }
     };
     const handleSubmit = (event) => {
          const form = event.currentTarget;
          if (form.checkValidity() === false) {
               // all fields aren't filled in-
               event.preventDefault();
               event.stopPropagation();
               // stop execution
          } else {
               event.preventDefault();

               signUp();
          }

          setValidated(true);
     };
     return (
          <>
               <Form style={{ justifySelf:'center'}} className="signUpForm" noValidate validated={validated} onSubmit={handleSubmit}>
                         <Row className="g-3 mb-3">
                              <Form.Group as={Col} xs={12} controlId="validationCustom01">
                                   <Form.Label>Email</Form.Label>
                                   <Form.Control
                                        value={userSigningUp.email}
                                        onChange={(e) => {
                                             setUserSigningUp((prev) => {
                                                  return { ...prev, email: e.target.value };
                                             });
                                        }}
                                        required
                                        type="text"
                                        placeholder="Enter your email here"
                                   />
                                   <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                              </Form.Group>
                              <Form.Group as={Col} xs={12} controlId="validationCustom02">
                                   <Form.Label>Confirm Email</Form.Label>
                                   <Form.Control
                                        value={userSigningUp.confirmEmail}
                                        onChange={(e) => {
                                             setUserSigningUp((prev) => {
                                                  return { ...prev, confirmEmail: e.target.value };
                                             });
                                        }}
                                        required
                                        type="text"
                                        placeholder="Enter your email again"
                                   />
                                   <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                              </Form.Group>
                              <Form.Group as={Col} xs={12} controlId="validationCustomUsername">
                                   <Form.Label>Username</Form.Label>
                                   <InputGroup hasValidation>
                                        <InputGroup.Text id="inputGroupPrepend">@</InputGroup.Text>
                                        <Form.Control
                                             value={userSigningUp.username}
                                             onChange={(e) => {
                                                  setUserSigningUp((prev) => {
                                                       return { ...prev, username: e.target.value };
                                                  });
                                             }}
                                             type="text"
                                             placeholder="Username"
                                             aria-describedby="inputGroupPrepend"
                                             required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                             Please choose a username.
                                        </Form.Control.Feedback>
                                        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                                   </InputGroup>
                              </Form.Group>
                         </Row>
                         <Row className="g-3 mb-3">
                              <Form.Group as={Col} xs={12} controlId="validationCustom04">
                                   <Form.Label>Password</Form.Label>
                                   <Form.Control
                                        value={userSigningUp.password}
                                        onChange={(e) => {
                                             setUserSigningUp((prev) => {
                                                  return { ...prev, password: e.target.value };
                                             });
                                        }}
                                        type="password"
                                        placeholder="Password"
                                        required
                                   />
                                   <Form.Control.Feedback type="invalid">
                                        Please provide a password.
                                   </Form.Control.Feedback>
                              </Form.Group>
                              <Form.Group as={Col} xs={12} controlId="validationCustom05">
                                   <Form.Label>Confirm Password</Form.Label>
                                   <Form.Control
                                        value={userSigningUp.confirmPassword}
                                        onChange={(e) => {
                                             setUserSigningUp((prev) => {
                                                  return { ...prev, confirmPassword: e.target.value };
                                             });
                                        }}
                                        type="password"
                                        placeholder="Enter Password Again"
                                        required
                                   />
                                   <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                                   <Form.Control.Feedback type="invalid">
                                        Please enter your password.
                                   </Form.Control.Feedback>
                              </Form.Group>
                         </Row>
                         <Form.Group className="mb-3">
                              <Form.Check
                                   required
                                   label="Agree to terms and conditions"
                                   feedback="You must agree before submitting."
                                   feedbackType="invalid"
                              />
                         </Form.Group>
                         <a className="logInSignUp" onClick={() => setSigningIn(true)} rel="noopener noreferrer">
                              Have an account ? Log in{" "}
                         </a>
                         <Button disabled={loading} type="submit">
                              {loading ? (
                                   <>
                                        <Spinner
                                             as="span"
                                             animation="border"
                                             size="sm"
                                             role="status"
                                             aria-hidden="true"
                                        />
                                        <span className="sr-only">Signing Up...</span>
                                   </>
                              ) : (
                                   "Sign Up"
                              )}
                         </Button>
                    </Form>
               {error && <Alert variant="danger" className="mx-auto mt-3" style={{ maxWidth: "27rem" }}>{error}</Alert>}
          </>
     );
};
