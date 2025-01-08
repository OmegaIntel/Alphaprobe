import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setPaymentCompleted } from "../../redux/paymentSlice";
import { API_BASE_URL } from "../../services";
import { useAuth0 } from "@auth0/auth0-react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./CheckoutForm.css"; // Importing the CSS file for styles

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, user } = useAuth0();

    useEffect(() => {
        const checkPaymentStatusAndRedirect = async () => {
            if (!isAuthenticated) {
                navigate("/login");
                return;
            }

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
                    const isPaid = data.payment_status === "completed";

                    if (isPaid) {
                        navigate("/dashboard");
                    }
                } catch (error) {
                    console.error("Error fetching payment status:", error);
                }
            }
        };

        if (!isLoading) {
            checkPaymentStatusAndRedirect();
        }
    }, [isLoading, isAuthenticated, user, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: 1000, user_id: user.sub })
        });
        const { clientSecret } = await response.json();

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement)
            }
        });

        if (error) {
            setError(error.message);
        } else if (paymentIntent.status === "succeeded") {
            setSuccess(true);
            dispatch(setPaymentCompleted(true));
            navigate("/dashboard");
        }
        setLoading(false);
    };

    if (!isAuthenticated) {
        navigate("/login");
    }

    const cardStyle = {
        style: {
            base: {
                color: "#000",
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: "antialiased",
                fontSize: "16px",
                "::placeholder": {
                    color: "#d3d3d3"
                }
            },
            invalid: {
                color: "#fa755a",
                iconColor: "#fa755a"
            }
        }
    };

    return (
        <div className="checkout-container">
            <h2>Complete Your Payment</h2>
            <form onSubmit={handleSubmit} className="checkout-form">
                <div className="form-group">
                    <label htmlFor="card-element">Card Details</label>
                    <div className="card-element-wrapper">
                        <CardElement id="card-element" options={cardStyle} />
                    </div>
                </div>
                <button type="submit" disabled={!stripe || loading} className="pay-button">
                    {loading ? "Processing..." : "Pay"}
                </button>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">Payment Successful!</p>}
            </form>
        </div>
    );
};

export default CheckoutForm;
