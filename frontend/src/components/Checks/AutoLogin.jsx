import React, { useEffect } from "react";
import {
  useNavigate,
} from "react-router-dom";
import { API_BASE_URL } from "../../services";
import Login from "../Login/index";
import { useAuth0 } from "@auth0/auth0-react";

const AutoLogin = () => {
    const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        const checkPaymentStatusAndRedirect = async () => {
            if (isAuthenticated && user) {
                // 1) Fetch
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/api/stripe-payment-details?user_sub=${user.sub}`,
                        { method: "GET" }
                    );
                    if (!response.ok) {
                        throw new Error("Failed to fetch Stripe payment details");
                    }
                    const data = await response.json();
                    const isCompleted = (data.payment_status === "completed");

                    // 2) Redirect immediately
                    if (isCompleted) {
                        navigate("/dashboard");
                    } else {
                        navigate("/checkout");
                    }
                } catch (error) {
                    console.error("Error fetching payment status:", error);
                    navigate("/checkout");
                }
            } else if (!isAuthenticated) {
                navigate("/login");
            }
        };

        // Only run after Auth0 has finished loading
        if (!isLoading) {
            checkPaymentStatusAndRedirect();
        }
    }, [isLoading, isAuthenticated, user, navigate]);


    if (isLoading) {
        return <p>Loading...</p>;
    }

    // Return whichever layout you want for the fallback
    return (
        isAuthenticated ? <p>Loading...</p> : <Login />
    );
};

export default AutoLogin;