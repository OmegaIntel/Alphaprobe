import React, { useState, useEffect } from "react";
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
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import * as amplitude from '@amplitude/analytics-browser';
import DocumentAnalysisLayout from "./components/DocumentAnalysis/DocumentAnalysisLayout";


amplitude.init('b07260e647c7c3cc3c25aac93aa17db8', undefined, {
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
    <Auth0Provider
    domain={process.env.REACT_APP_AUTH0_DOMAIN}
    clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin+"/dashboard",
      audience: process.env.REACT_APP_AUTH0_AUDIENCE,
    }}
    >
    <Router>
      <Routes>
        <Route path="/" element={<AutoLogin />} />
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

        {/* <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
        /> */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
        />

        {/* Trouble Shooting Route */}
      </Routes>
    </Router>
    </Auth0Provider>
  );
};

const AutoLogin = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect();
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return isAuthenticated ? <p>Welcome! Redirecting to home...</p> : null;
};

export default App;
