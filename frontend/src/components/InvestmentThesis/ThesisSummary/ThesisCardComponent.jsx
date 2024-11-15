import React, { useEffect, useState } from "react";
import ThesisSummaryCard from "./ThesisSummaryCard";
import { useSelector } from "react-redux";

const ThesisCardComponent = () => {
  const [industries, setIndustries] = useState([]);
  const [answers, setAnswers] = useState({});

  const responseData = useSelector((state) => state.formResponse?.data);
  console.log("Thesis card Response", responseData);

  useEffect(() => {
    // Update industries based on responseData or leave it empty
    setIndustries(responseData?.result || []);
  }, [responseData]);

  const handleInputChange = (industryCode, isSelected) => {
    setAnswers((prev) => ({
      ...prev,
      [industryCode]: isSelected,
    }));
  };

  console.log("Check industry", industries);

  return (
    <div className="flex flex-col px-16 py-10 min-h-screen w-full space-y-10 bg-[#151518]">
      {industries.length > 0 ? (
        <ThesisSummaryCard
          thesisSummary="This is the summary for the thesis."
          industries={industries}
          answers={answers}
          handleInputChange={handleInputChange}
        />
      ) : (
        <div className="text-white text-center text-lg">
          Please fill the above form to see the industries.
        </div>
      )}
    </div>
  );
};

export default ThesisCardComponent;
