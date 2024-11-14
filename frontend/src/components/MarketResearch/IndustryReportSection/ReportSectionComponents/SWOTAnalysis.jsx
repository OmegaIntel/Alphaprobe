import React from "react";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";

const SWOTAnalysis = ({ swotAnalysis }) => {
  if (!swotAnalysis) return null;

  // Reusable function for rendering each SWOT category
  const renderCategory = (title, items, IconComponent, iconColor) => (
    <div className="h-96 w-full md:w-[25rem] rounded-lg border border-gray-600 bg-[#0D0D0D] pt-6 pl-10 flex flex-col">
      <h2 className="text-xl font-semibold mb-10  text-[#e1e1e1]">{title}</h2>
      <ul className="text-[#7a7a7a]">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex space-y-1 mt-3">
              <div>
                <IconComponent className={`${iconColor} mr-2`} />
              </div>
              <li className="">{item}</li>
            </div>
          </div>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl my-10">
      <p className="text-2xl mx-10 my-5 mb-10 font-semibold text-white">
        SWOT Analysis
      </p>
      <div className="grid gap-20 grid-cols-1 md:grid-cols-2 items-start justify-center mx-40 mt-16 mb-10">
        {swotAnalysis.strengths &&
          renderCategory("Strengths", swotAnalysis.strengths, TaskAltRoundedIcon, "text-green-500")}
        {swotAnalysis.weaknesses &&
          renderCategory("Weaknesses", swotAnalysis.weaknesses, HighlightOffRoundedIcon, "text-red-500")}
        {swotAnalysis.opportunities &&
          renderCategory("Opportunities", swotAnalysis.opportunities, TaskAltRoundedIcon, "text-green-500")}
        {swotAnalysis.threats &&
          renderCategory("Threats", swotAnalysis.threats, HighlightOffRoundedIcon, "text-red-500")}
      </div>
    </div>
  );
};

export default SWOTAnalysis;
