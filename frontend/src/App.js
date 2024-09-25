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
import "./App.css";
import CreateDeal from "./components/create_deal/index";
import DilligenceContainer from "./components/dilligence_list/container";
import Dashboard from "./components/Dashboard";
import ProtectedLayout from "./components/ProtectedLayout";
import Categories from "./components/projectHeaders/categories";

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

  return (
    // <KanbanBoard/>
    <Router>
      <Routes>
        <Route
          path="/register"
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Register />}
        />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login setToken={handleSetToken} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout
              setToken={handleSetToken}
              setUpdateSidebarSessions={setUpdateSidebarSessions}
              isLoggedIn={isLoggedIn}
            >
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/create-deal"
          element={
            <ProtectedLayout
              setToken={handleSetToken}
              setUpdateSidebarSessions={setUpdateSidebarSessions}
              isLoggedIn={isLoggedIn}
            >
              <CreateDeal />
            </ProtectedLayout>
          }
        ></Route>
        <Route
          path="/action-items"
          element={
            <ProtectedLayout
              setToken={handleSetToken}
              setUpdateSidebarSessions={setUpdateSidebarSessions}
              isLoggedIn={isLoggedIn}
            >
              <DilligenceContainer />
            </ProtectedLayout>
          }
        ></Route>
        <Route
          path="/projects"
          element={
            <ProtectedLayout
              setToken={handleSetToken}
              setUpdateSidebarSessions={setUpdateSidebarSessions}
              isLoggedIn={isLoggedIn}
            >
              <Categories />
            </ProtectedLayout>
          }
        ></Route>
        <Route
          path="/chat"
          element={
            <ProtectedLayout
              setToken={handleSetToken}
              setUpdateSidebarSessions={setUpdateSidebarSessions}
              isLoggedIn={isLoggedIn}
            >
              <Chat updateSidebarSessions={updateSidebarSessions} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedLayout
              setToken={handleSetToken}
              setUpdateSidebarSessions={setUpdateSidebarSessions}
              isLoggedIn={isLoggedIn}
            >
              <Chat updateSidebarSessions={updateSidebarSessions} />
            </ProtectedLayout>
          }
        />

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
