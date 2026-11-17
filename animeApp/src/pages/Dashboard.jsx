import React, { useEffect } from "react";
import Animes from "../components/Animes";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { localGet, signInOffMem } from "../../memoryUtils";
import { logIn } from "../redux/userSlice";

export const Dashboard = ({ catalogLoading, catalogError }) => {
     const dispatch = useDispatch();
     const navigate = useNavigate();
     useEffect(() => {
          if (localGet("loggedIn")) {
               signInOffMem(dispatch, logIn, navigate);
               navigate("/dashboard");
               //   if we were already logged in- send us to- the dashboard
          }
          else {
               navigate('/')
          }
     }, []);
     return (
          <div>
               <Animes catalogLoading={catalogLoading} catalogError={catalogError} />
          </div>
     );
};
