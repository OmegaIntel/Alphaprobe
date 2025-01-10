// src/components/Login/LoginButton.tsx

import React, { FC, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useDispatch } from 'react-redux';
import { auth0Login } from "../../store/slices/authSlice";

interface LoginButtonProps {
  // Define props here if needed in the future
}

const LoginButton: FC<LoginButtonProps> = () => {
  const { loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      await loginWithRedirect();
      const token = await getAccessTokenSilently();

      console.log("Token - " + token);
      dispatch(auth0Login({ token }));
    } catch (error) {
      console.error("Login failed", error);
      setError("Login failed. Please try again.");
    }
  };

  return (
    <>
      <button
        onClick={handleLogin}
        className="w-full px-6 py-3 bg-[#0088cc] hover:bg-[#0056b3] text-white text-base font-medium rounded-md"
      >
        Login
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </>
  );
};

export default LoginButton;
