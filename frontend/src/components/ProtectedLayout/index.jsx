import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import UploadFilesModal from "../UploadFilesModal";
import { ModalProvider, useModal } from "../UploadFilesModal/ModalContext";

const ProtectedLayout = ({
  children,
  setToken,
  setUpdateSidebarSessions,
  isLoggedIn,
}) => {
  const { id } = useParams();

  return (
    <ModalProvider>
      <ProtectedLayoutInner
        id={id}
        setToken={setToken}
        setUpdateSidebarSessions={setUpdateSidebarSessions}
        isLoggedIn={isLoggedIn}
      >
        {children}
      </ProtectedLayoutInner>
    </ModalProvider>
  );
};

const ProtectedLayoutInner = ({
  children,
  setToken,
  setUpdateSidebarSessions,
  isLoggedIn,
  id,
}) => {
  const { setDealId } = useModal(); // Use modal context here

  useEffect(() => {
    if (id) {
      setDealId(id); // Set dealId from the URL param
    }
  }, [id, setDealId]);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="App">
      <Sidebar setToken={setToken} setUpdateSidebarSessions={setUpdateSidebarSessions} />
      <div className="main-content with-sidebar">
        <Navbar />
        <UploadFilesModal />
        {children}
      </div>
    </div>
  );
};

export default ProtectedLayout;
