import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentCancel: React.FC = () => {
    const navigate = useNavigate();

    const handleRetry = () => {
        navigate("/checkout"); // Redirect to your checkout page to retry payment
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-center">
            <h1 className="text-4xl font-bold text-gray-50 mb-4">Payment Canceled</h1>
            <p className="text-lg text-gray-200 mb-8">
                You canceled the payment. If this was a mistake, you can try again.
            </p>
            <button
                onClick={handleRetry}
                className="bg-zinc-800 text-white px-6 py-3 rounded-md text-lg font-medium border border-zinc-800 hover:bg-stone-950 hover:border-stone-800 focus:outline-none focus:ring-4 transition duration-300"
            >
                Retry Payment
            </button>

        </div>
    );
};

export default PaymentCancel;
