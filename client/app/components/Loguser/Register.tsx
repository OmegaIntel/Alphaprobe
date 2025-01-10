import React, { FC } from "react";
import { Link } from "react-router-dom";
import RequestDemo from "../modals/request_demo";
import RegisterButton from "./RegisterButton";

const Register: FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen relative">
      <div className="auth-gradient h-full absolute xl:w-[60vw] xl:bottom-[5vw] xl:right-[50vw] lg:w-[80vw] lg:bottom-0 lg:right-[45vw] md:w-[100vw] md:bottom-0 md:right-[35vw]"></div>
      <img
        src="/images/company-logo.png"
        className="absolute top-0 right-0"
        alt="company logo"
      />
      <div className="xl:w-[745px] xl:h-[320px] z-10 lg:w-[675px] lg:h-[270px] md:w-[585px] md:h-[185px]">
        <img
          src="/images/register-image.png"
          alt="Register visual"
          className="w-full h-full"
        />
      </div>
      <div className="p-8 rounded-lg w-[450px]">
        <div className="mb-10">
          <h2 className="text-[20px] text-white tracking-widest font-bold">
            REGISTER
          </h2>
          <p className="text-sm text-white">
            Already have an account?{" "}
            <Link to="/login" className="text-[#33bbff]">
              Login
            </Link>
          </p>
        </div>
        <button
          type="submit"
          className="w-[120px] h-[40px] p-2.5 bg-[#0088cc] hover:bg-[#0056b3] text-white text-xs rounded-md mt-4"
        >
          <RegisterButton />
        </button>
        <div className="w-[60%] my-12 text-center border-b border-[#505059] leading-[0.1em]">
          <span className="bg-[#151518] px-4 text-[#a2a2a2]">or</span>
        </div>
        <div className="text-sm font-bold text-white mb-4">
          Schedule a personalized demo
        </div>
        <RequestDemo />
      </div>
    </div>
  );
};

export default Register;
