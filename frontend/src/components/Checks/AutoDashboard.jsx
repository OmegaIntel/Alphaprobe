import React, { useEffect } from "react";
import {
  useNavigate,
} from "react-router-dom";
import { API_BASE_URL } from "../../services";
import { useAuth0 } from "@auth0/auth0-react";
import ProtectedLayout from "../ProtectedLayout";

const AutoDashboard = ({ component: Component }) => {
    const { isAuthenticated, isLoading, user } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        // We'll combine the fetch and redirect logic in one effect:
        const checkPaymentStatusAndRedirect = async () => {
            // 1) If not authenticated, go straight to login
            if (!isAuthenticated) {
                navigate("/login");
                return;
            }

            // 2) If we do have a user, fetch the payment status
            if (user) {
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/api/stripe-payment-details?user_sub=${encodeURIComponent(user.sub)}`,
                        { method: "GET" }
                    );
                    if (!response.ok) {
                        throw new Error("Failed to fetch payment details");
                    }
                    const data = await response.json();
                    const isPaid = (data.payment_status === "completed");

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
        <ProtectedLayout
            isLoggedIn={isAuthenticated}
            isPaid={true}  // Because we only stay here if user is paid
        >
            <Component />
        </ProtectedLayout>
    );
};

export default AutoDashboard;