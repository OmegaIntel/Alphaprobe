import React from "react";
import ChatBox from "../ChatBox";

const Navbar = ({ isPublic }) => {
  return (
    <div className={`flex justify-between bg-[#151518] p-3 ${!isPublic && "ml-1"} mb-1`}>
      <div className="flex items-center">
        <h2>Omega Intelligence</h2>
      </div>
      {!isPublic? <ChatBox />: <img src="/images/logo.png" alt="" />}
    </div>
  );
};

export default Navbar;
