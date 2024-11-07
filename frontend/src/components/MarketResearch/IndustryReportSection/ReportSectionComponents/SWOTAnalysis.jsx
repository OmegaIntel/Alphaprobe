import React from "react";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";

const SWOTAnalysis = ({ swotAnalysis }) => {
  if (!swotAnalysis) return null;

  // Reusable function for rendering each SWOT category
  const renderCategory = (title, items, IconComponent, iconColor) => (
    <div className="h-96 w-[25rem] rounded-lg bg-[#0D0D0D] p-4">
      <h2 className="text-xl font-semibold mb-10 text-gray-400">{title}</h2>
      <ul className="text-gray-400">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex space-y-1">
              <div>
                <IconComponent className={`${iconColor} mr-2`} />
              </div>
              <li className="mt-1">{item}</li>
            </div>
          </div>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
      <p className="text-xl mx-10 my-5 font-semibold text-white">
        SWOT Analysis
      </p>
      <div className="space-y-4 grid gap-10 grid-cols-2 p-5 px-12 items-start justify-center mx-20">
        {swotAnalysis.strengths &&
          renderCategory("Strengths", swotAnalysis.strengths, TaskAltRoundedIcon, "text-green-400")}
        {swotAnalysis.weaknesses &&
          renderCategory("Weaknesses", swotAnalysis.weaknesses, HighlightOffRoundedIcon, "text-red-400")}
        {swotAnalysis.opportunities &&
          renderCategory("Opportunities", swotAnalysis.opportunities, TaskAltRoundedIcon, "text-green-400")}
        {swotAnalysis.threats &&
          renderCategory("Threats", swotAnalysis.threats, HighlightOffRoundedIcon, "text-red-400")}
      </div>
    </div>
  );
};

export default SWOTAnalysis;
