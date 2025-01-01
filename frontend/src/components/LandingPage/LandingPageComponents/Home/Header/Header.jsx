import React from "react";

const Header = () => {
  return (
    <div className="my-24 flex items-center justify-between">
      {/* Text content */}
      <div className="w-1/2 space-y-14">
        <h1 className="text-3xl font-medium">
          Automated Research and Diligence for Private Markets
        </h1>
        <p className="text-sm">
          Our platform transforms the private market deal process by automating
          research, modeling and due diligence - ingesting fragmented data from
          thousands of sources and turning it into actionable investment
          intelligence.
        </p>
      </div>

      {/* Image */}
      <div className="w-1/2 flex justify-center">
        <img src="images/Circle.svg" alt="Circle Illustration" className="max-w-full h-auto"/>
      </div>
    </div>
  );
};

export default Header;
