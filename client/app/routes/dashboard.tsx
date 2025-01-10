import React, { useEffect, ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "~/constant";
import { useAuth0 } from "@auth0/auth0-react";
import DashboardPage from "~/components/Dashboard/dashboard";
import { registerUser, checkUserExists } from "~/services/auth";

interface AutoDashboardProps {
  component: React.ComponentType;
}

const Dashboard: React.FC<AutoDashboardProps> = ({ component: Component }): ReactElement | null => {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const checkPaymentStatusAndRedirect = async () => {
      // 1) If not authenticated, go straight to login
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      // 2) If we do have a user, fetch the payment status
      if (user && user.sub && user.email) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/stripe-payment-details?user_sub=${encodeURIComponent(user.sub)}`,
            { method: "GET" }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch payment details");
          }
          const data = await response.json();
          const isPaid: boolean = data.payment_status === "completed";

          if(isPaid) {
            const isUser = await checkUserExists(user.email);
            if(!isUser) {
              const formData = new FormData();
              formData.append("email", user.email);
              formData.append("password", "Password");
              
              try {
                const result = await registerUser(formData);
                console.log("User registered successfully:", result);
              } catch (error) {
                console.error("Error during registration:", error);
                navigate("/");
              }
            }
          }

          // 3) If not paid, redirect to checkout
          if (!isPaid) {
            navigate("/checkout");
          }
          // If paid, do nothing; the user remains on this route
        } catch (error) {
          console.error("Error fetching payment status:", error);
          // Fallback behavior: assume not paid and send to checkout
          navigate("/checkout");
        }
      }
    };

    // Run only once Auth0 is finished loading
    if (!isLoading) {
      checkPaymentStatusAndRedirect();
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Still loading Auth0? Show a placeholder
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // If we haven't redirected away by now, that means:
  // 1) User is authenticated
  // 2) Payment is completed (or at least we didn't decide to redirect)
  // So we let <ProtectedLayout> handle the authorized/premium content
  return (
    <DashboardPage />
  );
};

export default Dashboard;
