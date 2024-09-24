import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await axios.post(`${API_BASE_URL}/token`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        setToken(response.data.access_token);
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen relative">
      <div className="auth-gradient w-[60vw] h-full absolute bottom-[20vw] right-[60vw]"></div>
      <img
        src="/images/company-logo.png"
        className="absolute top-0 right-0"
        alt="rahil"
      />
      <div className="p-8 rounded-lg w-[400px]">
        <div className="mb-10">
          <h2 className="text-[20px] text-white tracking-widest font-bold">
            LOGIN
          </h2>
          <p className="text-sm text-white">
            Don’t have an account?{" "}
            <Link to="/register" className="text-[#33bbff]">
              Register
            </Link>
          </p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-5 flex flex-col gap-3">
            <label className="text-xs text-[#8a8a90]">Email</label>
            <input
              type="email"
              placeholder="example@omegaintelligence.org"
              className="w-full p-[10px] bg-[#212126] border border-[#303038] rounded text-white text-sm outline-none placeholder:text-[#5c5c5c]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-5 flex flex-col gap-3 relative">
            <label className="text-xs text-[#8a8a90]">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full p-[10px] bg-[#212126] border border-[#303038] rounded text-white text-sm outline-none placeholder:text-[#5c5c5c]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="absolute right-[15px] top-[40px] text-gray-500 cursor-pointer hover:text-[#33bbff]"
              onClick={() => {
                setShowPassword(!showPassword);
              }}
            >
              {showPassword ? (
                <i className="fa fa-eye-slash"></i>
              ) : (
                <i className="fa fa-eye"></i>
              )}
            </span>
          </div>
          {/* <div className="remember-forgot">
            <label>
              Remember me
              <input type="checkbox" />
              <span class="checkmark"></span>
            </label>
            <a
              href="https://pro.openbb.co/forgot-password"
              target="_blank"
              rel="noopener noreferrer"
            >
              Forgot password?
            </a>
          </div> */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="w-[100px] h-[40px] bg-[#0088cc] rounded text-white text-xs hover:bg-[#0056b3]"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
