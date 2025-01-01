import React from "react";
import Navbar from "../../../Navbar";
import Header from "./Header/Header";
import Features from "./Features/Features";
import WhyUs from "./WhyUs/WhyUs";
import HowWork from "./HowWork/HowWork";

const Home = () => {
  return (
    <div>
      <Header />
      <Features />
      <HowWork />
      <WhyUs />
    </div>
  );
};

export default Home;
