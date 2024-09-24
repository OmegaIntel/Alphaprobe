import React from "react";
import { Navigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import UploadFilesModal from "../UploadFilesModal";
import { ModalProvider } from "../UploadFilesModal/ModalContext";

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
      <ModalProvider>
        <Sidebar
          setToken={setToken}
          setUpdateSidebarSessions={setUpdateSidebarSessions}
        />
        <div className="main-content with-sidebar">
          <Navbar />
          <UploadFilesModal />
          {children}
        </div>
      </ModalProvider>
    </div>
  );
};

export default ProtectedLayout;
