import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Chat from "./components/Chat";
import Register from "./components/Register";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import "./App.css";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [updateSidebarSessions, setUpdateSidebarSessions] = useState(
    () => () => {}
  );

  const handleSetToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const isLoggedIn = Boolean(token);
  const ProtectedRoute = ({ isLoggedIn, children }) => {
    return isLoggedIn ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        {isLoggedIn && (
          <Sidebar
            setToken={handleSetToken}
            setUpdateSidebarSessions={setUpdateSidebarSessions}
          />
        )}
        <div
          className={`main-content ${
            isLoggedIn ? "with-sidebar" : "without-sidebar"
          }`}
        >
          <Routes>
            <Route
              path="/register"
              element={isLoggedIn ? <Navigate to="/chat" /> : <Register />}
            />
            <Route
              path="/login"
              element={
                isLoggedIn ? (
                  <Navigate to="/chat" />
                ) : (
                  <Login setToken={handleSetToken} />
                )
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Chat
                    setToken={handleSetToken}
                    updateSidebarSessions={updateSidebarSessions}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Chat
                    setToken={handleSetToken}
                    updateSidebarSessions={updateSidebarSessions}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                isLoggedIn ? <Navigate to="/chat" /> : <Navigate to="/login" />
              }
            />

            <Route
              path="*"
              element={<Navigate to={isLoggedIn ? "/chat" : "/login"} />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
