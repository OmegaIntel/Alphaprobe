import React from "react";
import ChatBox from "../ChatBox";

const Navbar = () => {
  return (
    <div className="flex justify-between bg-[#151518] p-3 ml-1 mb-1">
      <div className="flex items-center">
        <h2>Omega Intelligence</h2>
      </div>
      <ChatBox />
    </div>
  );
};

export default Navbar;
