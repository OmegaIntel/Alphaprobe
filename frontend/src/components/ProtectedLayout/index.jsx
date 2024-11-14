import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import UploadFilesModal from "../UploadFilesModal";
import { useDispatch } from "react-redux";
import { setDealId } from "../../redux/dealsSlice";

const ProtectedLayout = ({ children, setToken, isLoggedIn }) => {
  const { id } = useParams();

  return (
    <ProtectedLayoutInner id={id} setToken={setToken} isLoggedIn={isLoggedIn}>
      {children}
    </ProtectedLayoutInner>
  );
};

const ProtectedLayoutInner = ({ children, setToken, isLoggedIn, id }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (id) {
      dispatch(setDealId(id));
    } else {
      dispatch(setDealId(null));
    }
  }, [id, dispatch]);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="App">
      <Sidebar setToken={setToken} />
      <div className="main-content with-sidebar">
        {/* <Navbar /> */}
        <UploadFilesModal />
        {children}
      </div>
    </div>
  );
};

export default ProtectedLayout;
