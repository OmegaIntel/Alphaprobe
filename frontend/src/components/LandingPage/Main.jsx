import React from "react";
import Navbar from "../Navbar";
import Footer from "./LandingPageComponents/Footer/Footer";

const Main = ({ children }) => {
  return (
    <div className="bg-white text-black">
      <Navbar />
      <div className="mx-48">{children}</div>
      <Footer />
    </div>
  );
};

export default Main;
