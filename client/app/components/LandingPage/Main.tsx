import React, { FC, ReactNode } from "react";
import Navbar from "~/components/LandingPage/LandingPageComponents/Navbar/Navbar";
import Footer from "~/components/LandingPage/LandingPageComponents/Footer/Footer";

interface MainProps {
  children: ReactNode;
}

const Main: FC<MainProps> = ({ children }) => {
  return (
    <div className="">
      <Navbar />
      <div className="mx-48">{children}</div>
      <Footer />
    </div>
  );
};

export default Main;
