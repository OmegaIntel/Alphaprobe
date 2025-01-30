import React from 'react';
import Header from './Header/Header';
import HowWork from './HowWork/HowWork';
import Features from './Feature/Feature';
import WhyUs from './Whyus/WhyUs';

const Home: React.FC = () => {
  return (
    <div>
      {/* Page Components */}
      <Header />
      <HowWork />
      <Features />
      <WhyUs />
    </div>
  );
};

export default Home;
