import React from "react";
import { useDispatch } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
  const { logout } = useAuth0();
  const dispatch = useDispatch();

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
    dispatch({ type: "LOGOUT" });
  };

  return <button onClick={handleLogout}>Log Out</button>;
};

export default LogoutButton;
