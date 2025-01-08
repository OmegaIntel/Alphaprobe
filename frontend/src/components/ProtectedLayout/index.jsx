import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import UploadFilesModal from "../UploadFilesModal";
import { useDispatch } from "react-redux";
import { setDealId } from "../../redux/dealsSlice";

const ProtectedLayout = ({ children, setToken, isLoggedIn, isPaid }) => {
  const { id } = useParams();

  return (
    <ProtectedLayoutInner id={id} setToken={setToken} isLoggedIn={isLoggedIn} isPaid={isPaid}>
      {children}
    </ProtectedLayoutInner>
  );
};

const ProtectedLayoutInner = ({ children, setToken, isLoggedIn, id, isPaid }) => {
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

  if(isLoggedIn && !isPaid) {
    return <Navigate to="/checkout" />;
  }

  return (
    <div className="App">
      
      <div className="main-content with-sidebar">
        {/* <Navbar /> */}
        <UploadFilesModal />
        {children}
      </div>
    </div>
  );
};

export default ProtectedLayout;
