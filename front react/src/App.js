import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import SingIn from "./pages/SingIn";
import SingUp from "./pages/SingUp";
import Posts from "./pages/Posts";
import NotFound from "./pages/NotFound";
import Alert from "@mui/material/Alert";
import { withAuthRedirect } from "./hoc/withAuthRedirect";

import axios from "./utils/axios";

const setBarrer = (token) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
};

const isAuthorization = !!axios.defaults.headers.common["Authorization"];

function App() {
  const [state, setState] = useState({
    userId: localStorage.getItem("userId") || null,
    isAuth: !!localStorage.getItem("token"),

    alertShow: false,
    alertText: "",
    alertType: "success",
  });

  useEffect(() => {
    window.addEventListener("unhandledrejection", ({ reason }) => {
      const { errors } = reason?.response?.data || {};

      const error =
        (errors?.length && errors[0].msg) ||
        reason?.response?.data?.message ||
        reason.message;

      setAlert(error, "error");
    });
  }, []);

  if (!isAuthorization) {
    const token = localStorage.getItem("token");
    setBarrer(token);
  }

  const auth = (userId, token) => {
    setState({
      ...state,
      userId,
      isAuth: true,
    });

    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    setBarrer(token);
  };

  const setAlert = (text, type = "success") => {
    setState({
      ...state,
      alertText: text,
      alertShow: true,
      alertType: type,
    });

    setTimeout(() => {
      setState({
        ...state,
        alertText: text,
        alertShow: false,
        alertType: type,
      });
    }, 2000);
  };

  return (
    <>
      <Routes>
        <Route
          exact
          path="/"
          element={withAuthRedirect(
            <Posts isAuth={state.isAuth} userId={state.userId} />
          )}
        />
        <Route path="/sing-in" element={<SingIn auth={auth} />} />
        <Route path="/sing-up" element={<SingUp setAlert={setAlert} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Alert
        severity={state.alertType}
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          transition: "0.4s",
          opacity: state.alertShow ? "1" : "0",
        }}
      >
        {state.alertText}
      </Alert>
    </>
  );
}

export default App;
