import React, { FC } from "react";
import { useDispatch } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

const RegisterButton: FC = () => {
  const { loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();

  const handleLogin = async (): Promise<void> => {
    try {
      // Use type assertion to bypass TypeScript error for unsupported property
      await loginWithRedirect({ screen_hint: "signup" } as any);

      const token: string = await getAccessTokenSilently();
      console.log("Token - " + token);

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

export default RegisterButton;
