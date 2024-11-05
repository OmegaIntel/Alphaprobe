import React from "react";
import StarsIcon from "@mui/icons-material/Stars";
import ErrorIcon from "@mui/icons-material/Error";

const IndustryImpact = ({ industryImpact }) => {
  return (
    <div className="bg-gray-600/30 rounded-xl p-6 px-10">
      {/* <h3 className="text-xl font-semibold mb-4">Industry Impact</h3> */}

      {/* Positive Impact Factors */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-green-500">Positive</h4>
        <ul className="mt-2 space-y-2">
          {industryImpact.positive_impact_factors.map((factor, index) => (
            <div className="flex space-x-3 items-center">
                <StarsIcon  className="text-green-400"/>
              <li key={index} className="text-gray-300 rounded-md p-2">
                {factor}
              </li>
            </div>
          ))}
        </ul>
      </div>

      {/* Negative Impact Factors */}
      <div>
        <h4 className="text-lg font-semibold text-red-500">Negative </h4>
        <ul className="mt-2 space-y-2">
          {industryImpact.negative_impact_factors.map((factor, index) => (
            <div className="flex space-x-3 items-center">
            <ErrorIcon  className="text-red-400"/>
          <li key={index} className="text-gray-300 rounded-md p-2">
            {factor}
          </li>
        </div>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IndustryImpact;
