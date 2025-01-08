import { Form } from "@remix-run/react";

interface RegisterProps {
  errorMessage?: string;
}

export default function Register({ errorMessage }: RegisterProps) {
  return (
    <div className="flex justify-center bg-stone-950 items-center min-h-screen relative">
      {/* Background Gradient */}
      <div className="auth-gradient h-full absolute xl:w-[60vw] xl:bottom-[5vw] xl:right-[50vw] lg:w-[80vw] lg:bottom-0 lg:right-[45vw] md:w-[100vw] md:bottom-0 md:right-[35vw]"></div>


      {/* Register Image */}
      <div className="xl:w-[745px] xl:h-[320px] z-10 lg:w-[675px] lg:h-[270px] md:w-[585px] md:h-[185px]">
        <img
          src="/images/register-image.png"
          alt="Register Illustration"
          className="w-full h-full"
        />
      </div>

      {/* Register Form */}
      <div className="p-8 rounded-lg w-[450px] bg-[#212126] border border-[#303038]">
        <div className="mb-10">
          <h2 className="text-[20px] text-white tracking-widest font-bold">
            REGISTER
          </h2>
          <p className="text-sm text-white">
            Already have an account?{" "}
            <a href="/login" className="text-[#33bbff]">
              Login
            </a>
          </p>
        </div>

        {/* Form */}
        <Form method="post">
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
            />
          </div>

          {/* Confirm Password Field */}
          <div className="mb-5 flex flex-col gap-3">
            <label className="text-xs text-[#8a8a90]">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              className="w-full p-[10px] bg-[#212126] border border-[#303038] rounded text-white text-sm outline-none placeholder:text-[#5c5c5c]"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center">
            <button
              type="submit"
              className="w-[120px] h-[40px] p-2.5 bg-[#0088cc] hover:bg-[#0056b3] text-white text-xs rounded-md mt-4"
            >
              Register
            </button>

            {/* Or Divider */}
            <div className="w-[60%] my-12 text-center border-b border-[#505059] leading-[0.1em]">
              <span className="bg-[#151518] px-4 text-[#a2a2a2]">or</span>
            </div>

            {/* Schedule Demo */}
            <div className="text-sm font-bold text-white mb-4">
              Schedule a personalized demo
            </div>
            <button
              type="button"
              className="w-[120px] h-[40px] p-2.5 bg-[#33bbff] hover:bg-[#0088cc] text-white text-xs rounded-md"
            >
              Request Demo
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
