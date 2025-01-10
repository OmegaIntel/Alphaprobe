import React, { useEffect, ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "~/constant";
import { useAuth0 } from "@auth0/auth0-react";

const Register: React.FC = (): ReactElement | null => {
  const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPaymentStatusAndRedirect = async (): Promise<void> => {
      // Redirect to Auth0 signup page if not authenticated
      if (!isAuthenticated) {
        await loginWithRedirect({
          screen_hint: "signup", // Redirect to the signup screen
        } as any);
        return;
      }

      // If authenticated and user exists, fetch payment status
      if (user && user.sub) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/stripe-payment-details?user_sub=${encodeURIComponent(user.sub)}`,
            { method: "GET" }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch payment status");
          }

          const data = await response.json();
          const isCompleted: boolean = data.payment_status === "completed";

          // Redirect based on payment status
          if (isCompleted) {
            navigate("/dashboard");
          } else {
            navigate("/checkout");
          }
        } catch (error) {
          console.error("Error fetching payment status:", error);
          // Fallback to checkout if payment status cannot be confirmed
          navigate("/checkout");
        }
      }
    };

    // Execute the logic after Auth0 has finished loading
    if (!isLoading) {
      fetchPaymentStatusAndRedirect();
    }
  }, [isAuthenticated, isLoading, user, loginWithRedirect, navigate]);

  // Show a loading message while waiting for Auth0 to load
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // Fallback UI is not required here since loginWithRedirect will handle unauthenticated users.
  return null;
};

export default Register;
