import React from "react";

interface MainProps {
  children: React.ReactNode;
}

const Main: React.FC<MainProps> = ({ children }) => {
    console.log("Maint rendering")
  return (
    <div className="bg-white text-black">
      {/* <Navbar /> */}
      <div className="mx-48">{children}</div>
     {/* // <Footer /> */}
    </div>
  );
};

export default Main;
