import React, { useEffect } from "react";
import {
  useNavigate,
} from "react-router-dom";
import { API_BASE_URL } from "../../services";
import Register from "../Register";
import { useAuth0 } from "@auth0/auth0-react";

const AutoRegister = () => {
    const { isAuthenticated, isLoading, user } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPaymentStatusAndRedirect = async () => {
            // 1) If not authenticated, go to /register.
            if (!isAuthenticated) {
                navigate("/register");
                return; // Stop here
            }

            // 2) If we have a user, fetch payment status.
            if (user) {
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/api/stripe-payment-details?user_sub=${encodeURIComponent(user.sub)}`,
                        { method: "GET" }
                    );
                    if (!response.ok) {
                        throw new Error("Failed to fetch payment status");
                    }

                    const data = await response.json();
                    const isCompleted = (data.payment_status === "completed");

                    // 3) Decide where to redirect based on payment status.
                    if (isCompleted) {
                        navigate("/dashboard");
                    } else {
                        navigate("/checkout");
                    }
                } catch (error) {
                    console.error("Error fetching payment status:", error);
                    // Fallback: if we can't confirm they're paid, send to checkout
                    navigate("/checkout");
                }
            }
        };

        // Only run after Auth0 finishes loading
        if (!isLoading) {
            fetchPaymentStatusAndRedirect();
        }
    }, [isLoading, isAuthenticated, user, navigate]);

    // While Auth0 is loading, show a spinner or message
    if (isLoading) {
        return <p>Loading...</p>;
    }

    // If we didn’t redirect yet and user is not authenticated,
    // we might render <Register />. But most of the time,
    // the effect will have navigated before we get here.
    return !isAuthenticated ? <Register /> : null;
};

export default AutoRegister;