import React, { useState } from "react";

interface CAGR {
  begin_year?: string;
  end_year?: string;
  driver_cagr_value?: string | number;
}

interface Driver {
  external_drivers_point_title?: string;
  external_drivers_point_description?: string;
  driver_cagr_historical?: CAGR;
  driver_cagr_projected?: CAGR;
}

interface ExternalDriversProps {
  drivers?: Driver[]; // Allow undefined to avoid prop type errors
}

export const ExternalDrivers: React.FC<ExternalDriversProps> = ({
  drivers = [], // Default to an empty array if drivers is undefined
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleAll = (): void => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-[#171717] border rounded-xl border-[#2e2e2e] p-4">
      <div className="grid grid-cols-2 gap-6 text-gray-400">
        {drivers.map((driver, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <h3 className="text-lg font-bold mb-2">
              {driver.external_drivers_point_title || "No Title Available"}
            </h3>
            {isExpanded && (
              <>
                <p className="mb-4">
                  {driver.external_drivers_point_description ||
                    "No description available"}
                </p>
                <div className="flex justify-between space-x-4">
                  <div className="flex-1 p-2 rounded-md text-center border border-gray-400 hover:bg-gray-600 transition duration-200">
                    <h4 className="font-semibold">Historical CAGR</h4>
                    <p className="text-sm">
                      ({driver.driver_cagr_historical?.begin_year || "-"} -{" "}
                      {driver.driver_cagr_historical?.end_year || "-"})
                    </p>
                    <p className="font-bold text-green-500">
                      {driver.driver_cagr_historical?.driver_cagr_value || "N/A"}%
                    </p>
                  </div>
                  <div className="flex-1 p-2 rounded-md text-center border border-gray-400 hover:bg-gray-600 transition duration-200">
                    <h4 className="font-semibold">Projected CAGR</h4>
                    <p className="text-sm">
                      ({driver.driver_cagr_projected?.begin_year || "-"} -{" "}
                      {driver.driver_cagr_projected?.end_year || "-"})
                    </p>
                    <p className="font-bold text-green-500">
                      {driver.driver_cagr_projected?.driver_cagr_value || "N/A"}%
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {drivers.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={toggleAll}
            className="mt-12 mb-6 w-1/5 bg-[#1d2a41] text-white border-2 border-[#404040] py-2 rounded-full font-medium hover:bg-gray-600 transition duration-200"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
      {drivers.length === 0 && (
        <p className="text-gray-400 text-center mt-6">
          No external drivers available.
        </p>
      )}
    </div>
  );
};

export default ExternalDrivers;
