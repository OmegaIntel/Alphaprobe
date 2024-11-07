import React, { useEffect, useState } from "react";
import ThesisSummaryCard from "./ThesisSummaryCard";

const ThesisCardComponent = () => {
  const [industries, setIndustries] = useState([]);
  const [answers, setAnswers] = useState({});

  const staticData = {
    result: [
      {
        industry_name: "Software Publishers",
        industry_code: "5112",
      },
      {
        industry_name: "Data Processing, Hosting, and Related Services",
        industry_code: "518",
      },
      {
        industry_name: "Computer Systems Design and Related Services",
        industry_code: "5415",
      },
      {
        industry_name: "Management, Scientific, and Technical Consulting Services",
        industry_code: "5416",
      },
      {
        industry_name: "Scientific Research and Development Services",
        industry_code: "5417",
      },
      {
        industry_name: "Advertising, Public Relations, and Related Services",
        industry_code: "5418",
      },
      {
        industry_name: "Architectural, Engineering, and Related Services",
        industry_code: "5413",
      },
      {
        industry_name: "Legal Services",
        industry_code: "5411",
      },
      {
        industry_name: "Accounting, Tax Preparation, Bookkeeping, and Payroll Services",
        industry_code: "5412",
      },
      {
        industry_name: "Management of Companies and Enterprises",
        industry_code: "55",
      },
    ],
  };

  useEffect(() => {
    // Set state with static JSON data
    setIndustries(staticData.result);
  }, []);

  const handleInputChange = (industryCode, isSelected) => {
    setAnswers((prev) => ({
      ...prev,
      [industryCode]: isSelected,
    }));
  };

  return (
    <div className="flex flex-col px-16 py-10 min-h-screen w-full space-y-10 bg-[#151518]">
      <ThesisSummaryCard
        thesisSummary="This is the summary for the thesis."
        industries={industries}
        answers={answers}
        handleInputChange={handleInputChange}
      />
    </div>
  );
};

export default ThesisCardComponent;

// import React, { useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux'; // Import your action for updating industries
// import ThesisSummaryCard from './ThesisSummaryCard';
// import { updateSelectedIndustries } from '../../../redux/formResponseSlice';

// const ThesisCardComponent = () => {
//   const dispatch = useDispatch();
//   const [answers, setAnswers] = useState({});

//   // Select industries from the Redux store, defaulting to an empty array if null or undefined
//   const industries = useSelector((state) => state.formResponse.data?.result) || [];

//   const handleInputChange = (industryCode) => {
//     setAnswers((prev) => ({
//       ...prev,
//       [industryCode]: !prev[industryCode],
//     }));

//     // Find the selected industry by industry code
//     const selectedIndustry = industries.find(
//       (industry) => industry.industry_code === industryCode
//     );

//     if (selectedIndustry) {
//       dispatch(updateSelectedIndustries(selectedIndustry));
//     }
//   };

//   return (
//     <div className="flex flex-col px-16 py-10 min-h-screen w-full space-y-10 bg-[#151518]">
//       {industries.map((industry, index) => (
//         <ThesisSummaryCard
//           key={index}
//           industries={industries}
//           answers={answers}
//           handleInputChange={handleInputChange}
//         />
//       ))}
//     </div>
//   );
// };

// export default ThesisCardComponent;
