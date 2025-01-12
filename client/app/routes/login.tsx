import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "@remix-run/react";
import { loginUserToAuth0 } from "~/services/auth";
import { useAuth } from "~/services/AuthContext";
import { API_BASE_URL } from "~/constant";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const { isAuthenticated, isLoading, user } = useAuth();

  // Handle navigation based on authentication state
  useEffect(() => {
    const checkPaymentStatusAndRedirect = async () => {
      if (!isLoading && isAuthenticated) {
        navigate("/dashboard");
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
  }, [isAuthenticated, isLoading, user, navigate]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const data = await loginUserToAuth0(email, password);
      if (data) {
        console.log("Login successful, redirecting to /checkout...");
        window.location.reload();
        navigate("/checkout");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Login failed");
    }
  };

  return (
    <div className="flex justify-center bg-stone-950 items-center min-h-screen relative">
      {/* Background Gradient */}
      <div className="auth-gradient h-full absolute xl:w-[60vw] xl:bottom-[5vw] xl:right-[50vw] lg:w-[80vw] lg:bottom-0 lg:right-[45vw] md:w-[100vw] md:bottom-0 md:right-[35vw]"></div>

      {/* Login Image */}
      <div className="xl:w-[745px] xl:h-[320px] z-10 lg:w-[675px] lg:h-[270px] md:w-[585px] md:h-[185px]">
        <img
          src="/images/register-image.png"
          alt="Login Illustration"
          className="w-full h-full"
        />
      </div>

      {/* Login Form */}
      <div className="p-8 rounded-lg w-[450px] bg-[#212126] border border-[#303038] z-20">
        <div className="mb-10">
          <h2 className="text-[20px] text-white tracking-widest font-bold">
            LOGIN
          </h2>
          <p className="text-sm text-white">
            Don't have an account?{" "}
            <a href="/register" className="text-[#33bbff]">
              Register
            </a>
          </p>
        </div>

        <Form method="post" onSubmit={handleSubmit}>
          {errorMessage && (
            <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
          )}

          {/* Email Field */}
          <div className="mb-5 flex flex-col gap-3">
            <label className="text-xs text-[#8a8a90]">Email</label>
            <input
              type="email"
              name="email"
              placeholder="example@omegaintelligence.org"
              className="w-full p-[10px] bg-[#212126] border border-[#303038] rounded text-white text-sm outline-none placeholder:text-[#5c5c5c]"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Field */}
          <div className="mb-5 flex flex-col gap-3 relative">
            <label className="text-xs text-[#8a8a90]">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="w-full p-[10px] bg-[#212126] border border-[#303038] rounded text-white text-sm outline-none placeholder:text-[#5c5c5c]"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center">
            <button
              type="submit"
              className="w-[120px] h-[40px] p-2.5 bg-[#0088cc] hover:bg-[#0056b3] text-white text-xs rounded-md mt-4"
            >
              Login
            </button>

            {/* Or Divider */}
            <div className="w-[60%] my-12 text-center border-b border-[#505059] leading-[0.1em]">
              <span className="bg-[#151518] px-4 text-[#a2a2a2]">or</span>
            </div>

            {/* Forgot Password */}
            <div className="text-sm font-bold text-white mb-4">
              Forgot your password?
            </div>
            <button
              type="button"
              className="w-[120px] h-[40px] p-2.5 bg-[#33bbff] hover:bg-[#0088cc] text-white text-xs rounded-md"
              onClick={() => navigate("/forgot-password")}
            >
              Reset Password
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
