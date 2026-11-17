import React, { useEffect, useState } from "react";
import { SignIn } from "../components/SignIn";
import { SignUp } from "../components/SignUp";
import { localGet, signInOffMem } from "../../memoryUtils";
import { useDispatch, useSelector } from "react-redux";
import { logIn } from "../redux/userSlice";
import { useNavigate } from "react-router";
import { LogoMark } from "../components/Logo";

export const LogInSignUp = () => {
     const [loggingIn, setLoggingIn] = useState(true);
     const dispatch = useDispatch();
     const navigate = useNavigate();
     const { shows } = useSelector((state) => state.animeKey);
     useEffect(() => {
          if (localGet("loggedIn")) {
               console.log("someone logged in");
               signInOffMem(dispatch, logIn, navigate);
               navigate("/dashboard");
               //   if we were already logged in- send us to- the dashboard
          }
     }, []);
     // KEEP logged in logic ^^

     // top-rated posters for the collage behind the brand panel
     const posters = [...(shows || [])]
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 9);

     return (
          <main className="auth-page">
               <section className="auth-brand" aria-hidden="true">
                    <div className="auth-collage">
                         {posters.map((show, i) => (
                              <img
                                   key={show.mal_id}
                                   src={`/anime_covers/${show.mal_id}.jpg`}
                                   alt=""
                                   style={{ animationDelay: `${i * 90}ms` }}
                              />
                         ))}
                    </div>
                    <div className="auth-brand__copy">
                         <LogoMark size={56} />
                         <h1>
                              Every story starts
                              <br />
                              <span>with a dream.</span>
                         </h1>
                         <p>Find, save, and keep track of the anime worth staying up for.</p>
                    </div>
               </section>
               <section className="auth-form">
                    <div className="auth-form__head">
                         <span className="eyebrow">{loggingIn ? "Welcome back" : "Join Yumemi"}</span>
                         <h2>{loggingIn ? "Log in to your list" : "Create your account"}</h2>
                    </div>
                    {loggingIn ? <SignIn setSigningIn={setLoggingIn} /> : <SignUp setSigningIn={setLoggingIn} />}
               </section>
          </main>
     );
};
