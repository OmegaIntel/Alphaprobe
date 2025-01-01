import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import "./App.css";
import CreateDeal from "./components/create_deal/index";
import Dashboard from "./components/Dashboard";
import ProtectedLayout from "./components/ProtectedLayout";
import Categories from "./components/projectHeaders/categories";
import DocumentsWrapper from "./components/FileUploadComponent/wrapper";
import CallbackPage from "./components/Login/CallbackPage";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import * as amplitude from '@amplitude/analytics-browser';
import DocumentAnalysisLayout from "./components/DocumentAnalysis/DocumentAnalysisLayout";
import LoginButton from "./components/Login/LoginButton";


amplitude.init('b07260e647c7c3cc3c25aac93aa17db8', undefined, {
  defaultTracking: true, // Automatically tracks page views and session properties
});


const App = () => {
  const { isAuthenticated, user } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated:", user);
      // Perform any actions based on authentication
      // For example, fetch user data or update state
    } else {
      console.log("User is not authenticated.");
    }
  }, [isAuthenticated, user]);

  return (
    <Auth0Provider
    domain="dev-tenant-testing.us.auth0.com"
    clientId="KznvQTTUvG9V24gsUxFWGILHdk0I565L"
    authorizationParams={{
      redirect_uri: window.location.origin + "/callback",
      scope: "openid profile email",
    }}
    cacheLocation="localstorage"
    >
        <Routes>
          <Route path="/" element={<AutoLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/guest/:id" element={<DocumentsWrapper />} />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/projects" /> : <Register />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout isLoggedIn={true}>
                <Categories />
              </ProtectedLayout>
            }
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
          />
        </Routes>
    </Auth0Provider>
  );
};

const AutoLogin = () => {
  const { loginWithRedirect, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        const fetchToken = async () => {
          try {
            const token = await getAccessTokenSilently();
            console.log("Access Token:", token); // Debugging token
          } catch (error) {
            console.error("Error fetching token:", error);
          }
        };
        fetchToken();
        navigate("/dashboard");
      } else {
        const fetchToken = async () => {
          try {
            const token = await getAccessTokenSilently();
            console.log("Access Token:", token); // Debugging token
          } catch (error) {
            console.error("Error fetching token:", error);
          }
        };
        fetchToken();
        navigate("/login"); // Redirect to Auth0 login screen
      }
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, navigate]);

  return isLoading ? <p>Loading...</p> : null;
};

export default App;
