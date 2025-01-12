import React, { FC } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "~/services/AuthContext";
import { useNavigate } from "@remix-run/react";

// Import the logout action from your auth slice
import { auth0Logout as logoutAction } from "../../store/slices/authSlice";

const LogoutButton: FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const dispatch = useDispatch();

  const handleLogout = () => {
    // Call Auth0 logout and then dispatch an action to update the Redux store
    logout();
    dispatch(logoutAction());
    navigate("/");
  };

  return <button
    className="text-white hover:text-gray-200 px-4 py-2 bg-zinc-800 font-medium hover:bg-stone-950 rounded transition duration-200"
    onClick={handleLogout}
  >
    Log Out
  </button>
  ;
};

export default LogoutButton;
