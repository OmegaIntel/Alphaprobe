import React, { FC } from "react";
import { Link } from "react-router-dom";
import LoginButton from "./LoginButton";

interface LoginProps {
  setToken?: (token: string) => void; 
  // Adjust the type of setToken based on actual usage.
}

const LoginPage: FC<LoginProps> = ({ setToken }) => {
  return (
    <div className="flex justify-center items-center min-h-screen relative">
      <div className="auth-gradient w-[60vw] h-full absolute bottom-[20vw] right-[60vw]"></div>
      <img
        src="/images/company-logo.png"
        className="absolute top-0 right-0"
        alt="company logo"
      />
      <div className="p-8 rounded-lg ">
        <div className="p-8 rounded-lg w-[400px] flex flex-col items-center space-y-6">
          <button
            type="button"
            className="bg-[#0088cc] hover:bg-[#0056b3] text-white text-base font-medium rounded-md"
          >
            <LoginButton />
          </button>
          <p className="text-sm text-white text-center">
            Don’t have an account?{" "}
            <Link to="/register" className="text-[#33bbff]">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
