import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "~/constant";
import { useAuth } from "~/services/AuthContext"; // Use your custom AuthContext
import DashboardPage from "~/components/Dashboard/dashboard";
import { registerUser, checkUserExists } from "~/services/auth";

interface AutoDashboardProps {
  component: React.ComponentType;
}

const Dashboard: React.FC<AutoDashboardProps> = ({ component: Component }) => {
  const { isAuthenticated, isLoading, user } = useAuth(); // Use custom auth hook
  const navigate = useNavigate();

  useEffect(() => {
    const checkPaymentStatusAndRedirect = async () => {
      // 1) If not authenticated, go straight to login
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      // 2) If we do have a user, fetch the payment status - don't remove this code
      // if (user && user.sub && user.email) {
      //   try {
      //     const response = await fetch(
      //       `${API_BASE_URL}/api/stripe-payment-details?user_id=${encodeURIComponent(user.sub)}`,
      //       { method: "GET" }
      //     );
      //     if (!response.ok) {
      //       throw new Error("Failed to fetch payment details");
      //     }

      //     const data = await response.json();
      //     const isPaid: boolean = data.payment_status === "completed";

      //     if (isPaid) {
      //       const isUser = await checkUserExists(user.email);
      //       if (!isUser) {
      //         const formData = new FormData();
      //         formData.append("email", user.email);
      //         formData.append("password", "Password"); // Replace with secure password generation

      //         try {
      //           const result = await registerUser(formData);
      //           console.log("User registered successfully:", result);
      //         } catch (error) {
      //           console.error("Error during registration:", error);
      //           navigate("/"); // Fallback in case registration fails
      //         }
      //       }
      //     }

      //     // 3) If not paid, redirect to checkout
      //     if (!isPaid) {
      //       navigate("/checkout");
      //       return;
      //     }
      //     // If paid, the user stays on this route
      //   } catch (error) {
      //     console.error("Error fetching payment status:", error);
      //     // Fallback behavior: assume not paid and send to checkout
      //     navigate("/checkout");
      //   }
      // }
    };

    // Run only once authentication is resolved
    if (!isLoading) {
      checkPaymentStatusAndRedirect();
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Show a loading placeholder while auth is being resolved
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // If we're here:
  // 1) The user is authenticated
  // 2) Payment is either completed or hasn't required a redirect
  return <DashboardPage />;
};

export default Dashboard;
