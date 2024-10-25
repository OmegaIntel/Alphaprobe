import React, { useEffect, useState } from 'react';
import ThesisSummaryCard from './ThesisSummaryCard';

const ThesisCardComponent = () => {
  const [theses, setTheses] = useState([]);
  const [answers, setAnswers] = useState({});

  const staticData = [
    {
      thesis_summary: "This thesis investigates the future trends in manufacturing industries, focusing on technological advancements and their impact on productivity and sustainability.",
      suggested_industries: [
        { industry_name: "Semiconductor and Related Device Manufacturing", industry_code: "334413" },
        { industry_name: "Surgical and Medical Instrument Manufacturing", industry_code: "339112" },
        { industry_name: "Pharmaceutical Preparation Manufacturing", industry_code: "325412" },
        { industry_name: "Iron and Steel Mills", industry_code: "331110" },
        { industry_name: "Petroleum Refineries", industry_code: "324110" }
      ]
    },
    {
      thesis_summary: "This thesis explores the role of AI in modern healthcare, examining its applications in diagnostics and patient management, with a focus on ethical considerations and patient outcomes.",
      suggested_industries: [
        { industry_name: "Healthcare Technology", industry_code: "621512" },
        { industry_name: "Pharmaceutical Preparation Manufacturing", industry_code: "325412" },
        { industry_name: "Data Analytics", industry_code: "541511" },
        { industry_name: "Telemedicine Services", industry_code: "621111" },
        { industry_name: "Medical Device Manufacturing", industry_code: "339113" }
      ]
    }
  ];

  useEffect(() => {
    // Set state with static JSON data
    setTheses(staticData);
  }, []);

  const handleInputChange = (industryCode) => {
    setAnswers((prev) => ({
      ...prev,
      [industryCode]: !prev[industryCode],
    }));
  };

  return (
    <div className="flex flex-col px-16 py-10 min-h-screen w-full space-y-10 bg-[#151518]">
      {theses.map((thesis, index) => (
        <ThesisSummaryCard 
          key={index}
          thesisSummary={thesis.thesis_summary} 
          industries={thesis.suggested_industries} 
          answers={answers} 
          handleInputChange={handleInputChange} 
        />
      ))}
    </div>
  );
};

export default ThesisCardComponent;
