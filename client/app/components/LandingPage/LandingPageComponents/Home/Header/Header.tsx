import React, { FC } from "react";

const Header: FC = () => {
  return (
    <div className="my-24 flex items-center justify-between">
      {/* Text content */}
      <div className="w-1/2 space-y-8">
        <h1 className="text-3xl font-medium">
          Automated Research and Diligence for Private Markets
        </h1>
        <p className="text-sm text-gray-600">
          Our platform transforms the private market deal process by automating
          research, modeling, and due diligence - ingesting fragmented data from
          thousands of sources and turning it into actionable investment
          intelligence.
        </p>

        {/* Input field */}
        <div className="flex items-center border border-gray-300 rounded-full overflow-hidden shadow-sm w-full max-w-lg">
          <input
            type="email"
            placeholder="Business email"
            className="flex-1 px-4 py-2 text-gray-800 focus:outline-none"
          />
          <button className="flex items-center px-6 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
            Request Access
            <span className="ml-2">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="w-1/2 flex justify-center">
        <img
          src="images/dashboard.png"
          alt="Circle Illustration"
          className="max-w-full h-auto rounded-lg shadow-xl"
        />
      </div>
    </div>
  );
};

export default Header;
