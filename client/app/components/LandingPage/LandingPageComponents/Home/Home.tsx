import React, { FC } from "react";
import Navbar from "~/components/LandingPage/LandingPageComponents/Navbar/Navbar";
import Header from "~/components/LandingPage/LandingPageComponents/Home/Header/Header";
import Features from "~/components/LandingPage/LandingPageComponents/Home/Features/Features";
import WhyUs from "~/components/LandingPage/LandingPageComponents/Home/WhyUs/WhyUs";
import HowWork from "~/components/LandingPage/LandingPageComponents/Home/HowWork/HowWork";

const Home: FC = () => {
  return (
    <div>
      <Header />
      <HowWork />
      <Features />
      <WhyUs />
    </div>
  );
};

export default Home;
