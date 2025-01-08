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

      {/* Content */}
      <div className="flex flex-col items-center">
        {/* Center Column - Omega Terminal */}
        <div className="flex flex-col items-center text-center">
          <img
            src="images/network.svg"
            alt="Omega AI"
            className="mb-4 h-auto"
          />
        </div>

        {/* List Below the Image with Background */}
        <div
          className="grid grid-cols-3 gap-8 mt-8 w-full max-w-4xl p-8 rounded-lg bg-gray-700 bg-opacity-30"
        >
          <ul className="space-y-3 text-left">
            <li>Connect with Market Data</li>
            <li>Connect internal datasets</li>
          </ul>
          <ul className="space-y-3 text-left">
            <li>High Fidelity Proprietary Models</li>
            <li>Fact Based with Explainable AI</li>
          </ul>
          <ul className="space-y-3 text-left">
            <li>Executive ready presentations</li>
            <li>Automate research workflows</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HowWork;
