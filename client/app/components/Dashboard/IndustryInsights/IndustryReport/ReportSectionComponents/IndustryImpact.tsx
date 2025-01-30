import React, { lazy, Suspense } from "react";

// Lazy load MUI icons
const ThumbUpIcon = lazy(() => import("@mui/icons-material/ThumbUp"));
const ThumbDownAltIcon = lazy(() => import("@mui/icons-material/ThumbDownAlt"));

// Define the props type
interface IndustryImpactProps {
  industryImpact?: {
    positive_impact_factors?: string[];
    negative_impact_factors?: string[];
  };
}

const IndustryImpact: React.FC<IndustryImpactProps> = ({ industryImpact }) => {
  // Default fallback to empty arrays if not provided
  const { positive_impact_factors = [], negative_impact_factors = [] } =
    industryImpact || {};

  return (
    <div className="rounded-xl  p-6 px-10">
      {/* Positive Impact Factors */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white">Positive</h4>
        <ul className="mt-2 space-y-2">
          {positive_impact_factors.length > 0 ? (
            positive_impact_factors.map((factor, index) => (
              <div
                key={index}
                className="flex space-x-3 items-center border border-green-500 rounded-lg px-3 bg-green-700/10"
              >
                <Suspense fallback={<span>Loading...</span>}>
                  <ThumbUpIcon className="text-green-400" />
                </Suspense>
                <li className="text-gray-300 rounded-md p-2">{factor}</li>
              </div>
            ))
          ) : (
            <div className="text-gray-500">
              No positive impact factors available.
            </div>
          )}
        </ul>
      </div>

      {/* Negative Impact Factors */}
      <div>
        <h4 className="text-lg font-semibold text-white">Negative</h4>
        <ul className="mt-2 space-y-2">
          {negative_impact_factors.length > 0 ? (
            negative_impact_factors.map((factor, index) => (
              <div
                key={index}
                className="flex space-x-3 items-center border border-red-500 rounded-lg px-3 w-96 bg-red-900/10"
              >
                <Suspense fallback={<span>Loading...</span>}>
                  <ThumbDownAltIcon className="text-red-400" />
                </Suspense>
                <li className="text-gray-300 rounded-md p-2">{factor}</li>
              </div>
            ))
          ) : (
            <div className="text-gray-500">
              No negative impact factors available.
            </div>
          )}
        </ul>
      </div>
    </div>
  );
};

export default IndustryImpact;
