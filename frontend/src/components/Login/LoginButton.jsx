import React from "react";
import { useDispatch } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
  const { loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    await loginWithRedirect(); // Redirect user to Auth0 login
    dispatch({ type: "AUTH0_LOGIN", payload: { getAccessTokenSilently } });
  };

  return <button onClick={handleLogin}>Login</button>;
};

export default LoginButton;
