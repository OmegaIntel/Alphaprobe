import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { API_BASE_URL } from "~/constant";

const Login: React.FC = () => {
    const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        const checkPaymentStatusAndRedirect = async () => {
            if (!isAuthenticated) {
                // Redirect to login if not authenticated
                await loginWithRedirect();
                return;
            }

            if (user && user.sub) {
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/api/stripe-payment-details?user_sub=${encodeURIComponent(user.sub)}`,
                        { method: "GET" }
                    );

                    if (!response.ok) {
                        throw new Error("Failed to fetch Stripe payment details");
                    }

                    const data = await response.json();
                    const isCompleted = data.payment_status === "completed";

                    // Redirect based on payment status
                    if (isCompleted) {
                        navigate("/dashboard");
                    } else {
                        navigate("/checkout");
                    }
                } catch (error) {
                    console.error("Error fetching payment status:", error);
                    navigate("/checkout");
                }
            }
        };

        if (!isLoading) {
            checkPaymentStatusAndRedirect();
        }
    }, [isAuthenticated, isLoading, user, loginWithRedirect, navigate]);

    // Loading state
    if (isLoading) {
        return <p>Loading...</p>;
    }

    // Fallback for unauthenticated users
    return <p>Redirecting to login...</p>;
};

export default Login;
