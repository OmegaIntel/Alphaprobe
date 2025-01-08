import React from "react";
import { useDispatch } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
  const { loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      await loginWithRedirect({ screen_hint: "signup" });
      const token = await getAccessTokenSilently();

      console.log("Token - " + token)
      dispatch({
        type: "AUTH0_LOGIN",
        payload: { token },
      });
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return <button onClick={handleLogin}>Register</button>;
};

export default LoginButton;