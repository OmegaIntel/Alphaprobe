import React from "react";
import { Navigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";

const ProtectedLayout = ({
  children,
  setToken,
  setUpdateSidebarSessions,
  isLoggedIn,
}) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="App">
      <Sidebar
        setToken={setToken}
        setUpdateSidebarSessions={setUpdateSidebarSessions}
      />
      <div className="main-content with-sidebar">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

export default ProtectedLayout;
