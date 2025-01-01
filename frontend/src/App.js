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
import * as amplitude from '@amplitude/analytics-browser';
import DocumentAnalysisLayout from "./components/DocumentAnalysis/DocumentAnalysisLayout";
import { API_BASE_URL } from "./services";


amplitude.init('b07260e647c7c3cc3c25aac93aa17db8', undefined, {
  defaultTracking: true, // Automatically tracks page views and session properties
});


const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const handleSetToken = async (newToken) => {
    // Set the token locally
    setToken(newToken);
    localStorage.setItem("token", newToken);

    // Verify the token after setting it
    await verifyToken(newToken);
  };

  const verifyToken = async (currentToken) => {
    if (!currentToken) return;

    try {
      const formData = new FormData();
      formData.append("token", currentToken);

      const response = await fetch(`${API_BASE_URL}/api/token/verify`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // If the server returns an error, treat as invalid token
        clearToken();
        return;
      }

      const data = await response.json();
      if (data.valid === false) {
        // Token expired or invalid, clear it
        clearToken();
      }
      // If valid, do nothing
    } catch (error) {
      console.error("Error verifying token:", error);
      // If verification fails (e.g., network error), assume invalid
      clearToken();
    }
  };

  const clearToken = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  useEffect(() => {
    // On initial load, verify the token if it exists
    if (token) {
      verifyToken(token);
    }
  }, []);

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
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
        />
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </Router>
  );
};

export default App;
