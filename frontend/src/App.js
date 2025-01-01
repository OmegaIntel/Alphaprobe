import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import "./App.css";
import CreateDeal from "./components/create_deal/index";
import Dashboard from "./components/Dashboard";
import ProtectedLayout from "./components/ProtectedLayout";
import Categories from "./components/projectHeaders/categories";
import DocumentsWrapper from "./components/FileUploadComponent/wrapper";
import * as amplitude from "@amplitude/analytics-browser";

import DocumentAnalysisLayout from "./components/DocumentAnalysis/DocumentAnalysisLayout";
import Main from "./components/LandingPage/Main";
import Home from "./components/LandingPage/LandingPageComponents/Home/Home";

amplitude.init("b07260e647c7c3cc3c25aac93aa17db8", undefined, {
  defaultTracking: true, // Automatically tracks page views and session properties
});

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const handleSetToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const isLoggedIn = Boolean(token);

  return (
    <Router>
      <Routes>
        <Route path="/guest/:id" element={<DocumentsWrapper />} />
        <Route
          path="/register"
          element={isLoggedIn ? <Navigate to="/projects" /> : <Register />}
        />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/projects" />
            ) : (
              <Login setToken={handleSetToken} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout setToken={handleSetToken} isLoggedIn={isLoggedIn}>
              <Categories />
            </ProtectedLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout setToken={handleSetToken} isLoggedIn={isLoggedIn}>
              <Categories />
            </ProtectedLayout>
          }
        />
        <Route
          path="/document"
          element={
            <ProtectedLayout setToken={handleSetToken} isLoggedIn={isLoggedIn}>
              <DocumentAnalysisLayout />
            </ProtectedLayout>
          }
        ></Route>
        <Route
          path="/projects"
          element={
            <ProtectedLayout setToken={handleSetToken} isLoggedIn={isLoggedIn}>
              <Categories />
            </ProtectedLayout>
          }
        ></Route>
        <Route
          path="/projects/:id"
          element={
            <ProtectedLayout setToken={handleSetToken} isLoggedIn={isLoggedIn}>
              <Categories />
            </ProtectedLayout>
          }
        ></Route>

        <Route
          path="/"
          element={
            <Main>
              <Home />
            </Main>
          }
        />
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} />}
        />

        {/* Trouble Shooting Route */}
      </Routes>
    </Router>
  );
};

export default App;
