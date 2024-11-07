import React, { useState } from 'react';

const ExternalDrivers = ({ drivers }) => {
  const initialVisibleDrivers = 4; // Initial number of drivers shown
  const [visibleDrivers, setVisibleDrivers] = useState(initialVisibleDrivers);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAll = () => {
    setIsExpanded(!isExpanded);
  };

  const showMore = () => {
    setVisibleDrivers(drivers.length);
    setIsExpanded(true);
  };

  const showLess = () => {
    setVisibleDrivers(initialVisibleDrivers);
    setIsExpanded(false);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-6 text-gray-400">
        {drivers.slice(0, visibleDrivers).map((driver, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-lg p-4 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <h3
              onClick={toggleAll}
              className="text-lg font-bold mb-2 cursor-pointer hover:text-gray-200 transition-colors duration-200"
            >
              {driver.external_drivers_point_title}
            </h3>
            {isExpanded && (
              <>
                <p className="mb-4">{driver.external_drivers_point_description}</p>
                <div className="flex justify-between space-x-4">
                  <div className="flex-1 p-2 rounded-md text-center border border-gray-400 hover:bg-gray-600 transition duration-200">
                    <h4 className="font-semibold">Historical CAGR</h4>
                    <p className="text-sm">
                      ({driver.driver_cagr_historical.begin_year} - {driver.driver_cagr_historical.end_year})
                    </p>
                    <p className="font-bold text-green-500">
                      {driver.driver_cagr_historical.driver_cagr_value}%
                    </p>
                  </div>
                  <div className="flex-1 p-2 rounded-md text-center border border-gray-400 hover:bg-gray-600 transition duration-200">
                    <h4 className="font-semibold">Projected CAGR</h4>
                    <p className="text-sm">
                      ({driver.driver_cagr_projected.begin_year} - {driver.driver_cagr_projected.end_year})
                    </p>
                    <p className="font-bold text-green-500">
                      {driver.driver_cagr_projected.driver_cagr_value}%
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
<div className='flex justify-center'>

      <button
        onClick={isExpanded ? showLess : showMore}
        className="mt-12 mb-6 w-1/5 bg-[#1d2a41] text-white border-2 border-[#404040]  py-2 rounded-full font-medium hover:bg-gray-600 transition duration-200"
      >
        {isExpanded ? 'Show Less' : 'Show More'}
      </button>
</div>
    </div>
  );
};

export default ExternalDrivers;
