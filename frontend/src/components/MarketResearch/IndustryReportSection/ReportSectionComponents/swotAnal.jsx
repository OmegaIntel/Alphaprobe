import React, { useState } from "react";
import Accordion from "./swotdata";

const SwotAnal = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };
  // Toggle function to open/close FAQs
  const toggleFAQ = (index) => {
    if (openFAQ === index) {
      setOpenFAQ(null); // Close if already opened
    } else {
      setOpenFAQ(index); // Open the clicked FAQ
    }
  };

  const swotData = {
    strengths: ["Low Customer Class Concentration", "Low Product/Service Concentration"],
    weaknesses: ["Low & Steady Level of Assistance", "Medium Imports"],
    opportunities: ["High Revenue Growth (2019-2024)"],
    threats: ["Very Low Revenue Growth (2005-2024)"]
};
  return (
    <>
      <div className="text-white bg-slate-100/10 p-5 rounded-xl m-10">
        <h1 className="text-2xl text-gray-300 font-semibold px-10 pt-10">
          {" "}
          SWOT Analysis{" "}
        </h1>
        <div className="grid grid-cols-2 grid-rows-2 mt-20 mx-auto  gap-y-2 w-[50rem]">
          <div className="h-48 w-96 p-3 hover:bg-green-200/50 rounded-xl text-white bg-slate-200/10 transition-all ease-out duration-300 hover:border-green-600 hover:border-2 hover:text-black font-semibold text-xl">
            Strength
            <ul className="font-small text-lg mt-5 ml-6">
              <li>Sample List</li>
              <li>Sample List</li>
              <li>Sample List</li>
              <li>Sample List</li>
            </ul>
          </div>
          <div className="h-48 w-96 p-3 bg-red-200/50 rounded-xl border-red-600 border-2 text-black font-semibold text-xl">
            Weakness
            <ul className="font-small text-lg mt-5 ml-6">
              <li>Sample List</li>
              <li>Sample List</li>
              <li>Sample List</li>
              <li>Sample List</li>
            </ul>
          </div>
          <div className="h-48 w-96 p-3 bg-blue-200/50 rounded-xl border-blue-600 border-2 text-black font-semibold text-xl">
            Opportunities
            <ul className="font-small text-lg mt-5 ml-6">
              <li>Sample List</li>
              <li>Sample List</li>
              <li>Sample List</li>
              <li>Sample List</li>
            </ul>
          </div>
          <div className="h-48 w-96 p-3 bg-yellow-200/50 rounded-xl border-yellow-600 border-2 text-black font-semibold text-xl">
            Threats
            <ul className="font-small text-lg mt-5 ml-6">
              <li>Sample List</li>
              <li>Sample List</li>
              <li>Sample List</li>
              <li>Sample List</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="text-white bg-slate-100/10 p-5 rounded-xl m-10">
        <h1 className="text-2xl text-gray-300 font-semibold px-10 pt-10">
          {" "}
          SWOT Analysis{" "}
        </h1>
        <div>
            <Accordion swotAnalysis={swotData}/>
        </div>
      </div>
      
    </>
  );
};

export default SwotAnal;
