import React, { useState, useEffect, Component } from "react";
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
import CallbackPage from "./components/Login/CallbackPage";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import ProtectedLayout from "./components/ProtectedLayout";
import Categories from "./components/projectHeaders/categories";
import DocumentsWrapper from "./components/FileUploadComponent/wrapper";
import * as amplitude from '@amplitude/analytics-browser';
import DocumentAnalysisLayout from "./components/DocumentAnalysis/DocumentAnalysisLayout";
import { useSelector } from "react-redux";


amplitude.init('b07260e647c7c3cc3c25aac93aa17db8', undefined, {
  defaultTracking: true, // Automatically tracks page views and session properties
});


const App = () => {
  const AutoLogin = () => {
    const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
    const navigate = useNavigate();

    if (isLoading) {
      return <p>Loading...</p>;
    }

    if(!isLoading) {
      if(isAuthenticated) {
        navigate("/dashboard")
      }
    }
  
    return isAuthenticated ? <AutoDashboard component={Categories} /> : <Login />;
  };
  
  const AutoRegister = () => {
    const { isAuthenticated, isLoading } = useAuth0();
    const navigate = useNavigate();
  
    useEffect(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          navigate("/dashboard");
        }
      }
    }, [isAuthenticated, isLoading, navigate]);
  
    // Show the Register component if the user is not authenticated
    if (isLoading) {
      return <p>Loading...</p>;
    }
  
    return isAuthenticated ? null : <Register />;
  };

  const AutoDashboard = ({component: Component}) => {
    const { isAuthenticated, isLoading } = useAuth0();
    
    if (isLoading) {
      return <p>Loading...</p>;
    }
  
    return <ProtectedLayout  isLoggedIn={isAuthenticated}><Component /></ProtectedLayout>;
  };
  
  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin + "/callback",
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
    >
      <Routes>
        <Route path="/guest/:id" element={<DocumentsWrapper />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/register"
          element={<AutoRegister />}
        />
        <Route
          path="/login"
          element={<AutoLogin />}
        />

        <Route
          path="/dashboard"
          element={<AutoDashboard component={Categories}/>}
        />
        <Route
          path="/document"
          element={<AutoDashboard component={DocumentAnalysisLayout}/>}
        ></Route>
        <Route
          path="/projects"
          element={<AutoDashboard component={Categories}/>}
        ></Route>
        <Route
          path="/projects/:id"
          element={<AutoDashboard component={Categories}/>}
        ></Route>

        <Route
          path="/"
          element={<AutoLogin />}
        />
        <Route
          path="*"
          element={<AutoLogin />}
        />

        {/* Trouble Shooting Route */}
      </Routes>
    </Auth0Provider>
  );
};

export default App;
