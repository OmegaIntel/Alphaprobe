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
      <Features />
      <HowWork />
      <WhyUs />
    </div>
  );
};

export default Home;
