import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const CallbackPage = () => {
  const { isAuthenticated, isLoading, user } = useAuth0();
  console.log("User - " + user);
  console.log("Is Authenticated - " + isAuthenticated)
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate("/dashboard"); // Redirect to home after successful login
      } else {
        navigate("/login"); // Redirect back to login if not authenticated
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <p>Loading...</p>;
};

export default CallbackPage;
