import React from 'react';
import Hero from '../components/Hero';
import SmarterWay from '../components/SmarterWay';
import ProductGrid from '../components/ProductGrid';
import HowItWorks from '../components/HowItWorks';
import CreditSystem from '../components/CreditSystem';
import FAQ from '../components/FAQ';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <SmarterWay />
      <ProductGrid />
      <HowItWorks />
      <CreditSystem />
      <FAQ />
    </>
  );
};

export default Home;
