import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RequestDemo from "../modals/request_demo";
import { notification } from "antd";
import { register } from "../../services/registerService";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      notification.error({
        message: "Missing Required Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    try {
      const response = await register(formData);
      if (response.data.id) {
        notification.success({
          message: "Registered Successfully",
          description: "Your User is created successfully.",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        notification.error({
          message: "Something went wrong!",
          description:
            "There was an error submitting your deal request. Please try again.",
        });
      }
    } catch (error) {
      console.log(error);
      notification.error({
        message: "Something went wrong!",
        description:
          "There was an error submitting your deal request. Please try again.",
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen relative">
      <div className="auth-gradient  h-full absolute xl:w-[60vw] xl:bottom-[5vw] xl:right-[50vw] lg:w-[80vw] lg:bottom-0 lg:right-[45vw] md:w-[100vw] md:bottom-0 md:right-[35vw]"></div>
      <img
        src="/images/company-logo.png"
        className="absolute top-0 right-0"
        alt="rahil"
      />
      <div className="xl:w-[745px] xl:h-[320px] z-10 lg:w-[675px] lg:h-[270px] md:w-[585px] md:h-[185px]">
        <img
          src="/images/register-image.png"
          alt=""
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
        <form onSubmit={handleRegister}>
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
              className="absolute right-[15px] top-[38px] text-gray-500 cursor-pointer hover:text-[#33bbff]"
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
          <div className="flex flex-col items-center">
            <button
              type="submit"
              className="w-[120px] h-[40px] p-2.5 bg-[#0088cc] hover:bg-[#0056b3] text-white text-xs rounded-md mt-4"
            >
              Register
            </button>
            <div className="w-[60%] my-12 text-center border-b border-[#505059] leading-[0.1em]">
              <span className=" bg-[#151518] px-4 text-[#a2a2a2]">or</span>
            </div>
            <div className="text-sm font-bold text-white mb-4">
              Schedule a personalized demo
            </div>
            <RequestDemo />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
