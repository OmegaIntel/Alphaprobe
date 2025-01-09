import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setPaymentCompleted } from "~/store/slices/paymentSlice";
import { API_BASE_URL } from "~/constant";
import { useAuth0 } from "@auth0/auth0-react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import "~/components/Loguser/CheckoutForm.css"; 

interface PaymentIntentResponse {
  clientSecret: string;
}

const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth0();

  useEffect(() => {
    const checkPaymentStatusAndRedirect = async () => {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      if (user && user.sub) {
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!user || !user.sub) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    // Create a PaymentIntent
    const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1000, user_id: user.sub })
    });

    const paymentData: PaymentIntentResponse = await response.json();
    const { clientSecret } = paymentData;

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet.");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("CardElement not found.");
      setLoading(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement
      }
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setSuccess(true);
      dispatch(setPaymentCompleted(true));
      navigate("/dashboard");
    }

    setLoading(false);
  };

  if (!isAuthenticated) {
    navigate("/login");
    return null; // Render nothing while redirecting
  }

  const cardStyle: StripeCardElementOptions = {
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
