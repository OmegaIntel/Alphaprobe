import React from "react";

const HowWork = () => {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg text-white py-16 px-8">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold">How it works</h2>
        <p className="text-sm text-gray-400 mt-2">
          Select your sources, define analysis, and you're presented with a refined output like magic
        </p>
      </div>

      {/* Content Grid */}
      <div className="">
        

        {/* Center Column - Omega Terminal */}
        <div className="flex flex-col items-center text-center">
          <img
            src="images/network.svg"
            alt="Omega AI"
            className="mb-4  h-auto"
          />
          {/* <p className="text-lg font-semibold">Omega Terminal</p> */}
        </div>

       
      </div>
    </div>
  );
};

export default HowWork;
