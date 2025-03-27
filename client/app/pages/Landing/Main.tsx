import { FC, ReactNode } from "react";
import Navbar from "~/components/Navbar/Navbar";
import Footer from "~/components/Footer/Footer";

interface MainProps {
  children: ReactNode;
  backgroundImage?: string; // Optional prop to allow custom background images
}

const Main: FC<MainProps> = ({ children, backgroundImage = "/images/omegabkgrnd.jpg" }) => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Navbar />
      <div className="md:mx-48 relative z-10">{children}</div>
      <Footer />
    </div>
  );
};

export default Main;