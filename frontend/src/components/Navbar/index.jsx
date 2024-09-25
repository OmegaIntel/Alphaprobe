import React from "react";

const Navbar = () => {
  return (
    <div className="flex justify-between bg-[#151518] p-3 ml-1 mb-1">
      <div className="flex items-center">
        <h2>Omega Intelligence</h2>
      </div>
      <div className="flex justify-center items-center">
        <img src="/images/logo.png" alt="" />
        <span className="text-xs font-bold">Omega Copilot</span>
      </div>
    </div>
  );
};

export default Navbar;
