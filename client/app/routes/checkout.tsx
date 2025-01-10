import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { API_BASE_URL } from "~/constant";
import LogoutButton from "~/components/Loguser/LogoutButton";

const CheckoutForm: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout } = useAuth0();

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

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!user || !user.sub) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000, user_id: user.sub })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect user to Stripe Checkout URL
      window.location.href = url;
    } catch (error: any) {
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate("/login");
    return null; // Render nothing while redirecting
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 p-6">
      <h2 className="text-3xl font-semibold text-gray-200 mb-6">Please Subscribe</h2>
      <form onSubmit={handleCheckout} className="w-full max-w-md">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-800 text-white py-3 px-4 border border-zinc-800 rounded-md text-lg font-medium hover:bg-stone-950 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Redirecting..." : "Proceed to Checkout"}
        </button>
        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
      </form>
      <p className="text-gray-200 text-lg mt-8">or</p>
      <div className="flex items-center justify-center mt-4 gap-4">
        <button
          onClick={() => navigate("/")}
          className="bg-zinc-800 text-white py-2 px-4 rounded-md border border-zinc-800 font-medium hover:bg-stone-950"
        >
          Visit Homepage
        </button>
        <div
          className="bg-zinc-800 text-white border rounded-md border-zinc-800 hover:bg-stone-950 "
        >
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
