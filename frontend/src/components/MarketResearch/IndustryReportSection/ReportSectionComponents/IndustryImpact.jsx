import React from "react";
import StarsIcon from "@mui/icons-material/Stars";
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ErrorIcon from "@mui/icons-material/Error";
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';

const IndustryImpact = ({ industryImpact }) => {
  return (
    <div className=" rounded-xl p-6 px-10">
      {/* <h3 className="text-xl font-semibold mb-4">Industry Impact</h3> */}

      {/* Positive Impact Factors */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white">Positive</h4>
        <ul className="mt-2 space-y-2">
          {industryImpact.positive_impact_factors.map((factor, index) => (
            <div className="flex space-x-3 items-center border border-green-500 rounded-lg px-3 w-[30rem] bg-green-700/10">
              <ThumbUpIcon className="text-green-400" />
              <li key={index} className="text-gray-300 rounded-md p-2">
                {factor}
              </li>
            </div>
          ))}
        </ul>
      </div>

      {/* Negative Impact Factors */}
      <div>
        <h4 className="text-lg font-semibold text-white">Negative </h4>
        <ul className="mt-2 space-y-2">
          {industryImpact.negative_impact_factors.map((factor, index) => (
            <div className="flex space-x-3 items-center border border-red-500 rounded-lg px-3 w-[30rem] bg-red-900/10">
              <ThumbDownAltIcon className="text-red-400" />
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
