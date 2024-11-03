import React from 'react'

const ExternalDrivers = ({drivers}) => {
  return (
    <div>
     <div className="grid-cols-2 grid gap-6 text-gray-400">
      {drivers.map((driver, index) => (
        <div key={index} className="border border-gray-600 rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-bold mb-2">{driver.external_drivers_point_title}</h3>
          <p className="mb-4">{driver.external_drivers_point_description}</p>
          <div className="flex justify-between space-x-4">
            <div className="flex-1 p-2 rounded-md text-center border border-gray-400 ">
              <h4 className="font-semibold">Historical CAGR</h4>
              <p className='text-sm'>
                ( {driver.driver_cagr_historical.begin_year} - {driver.driver_cagr_historical.end_year} )
              </p>
              <p className="font-bold text-green-500">
                {driver.driver_cagr_historical.driver_cagr_value}%
              </p>
            </div>
            <div className="flex-1 p-3 rounded-md text-center border border-gray-400 ">
              <h4 className="font-semibold">Projected CAGR</h4>
              <p className='text-sm'>
                ( {driver.driver_cagr_projected.begin_year} - {driver.driver_cagr_projected.end_year})
              </p>
              <p className="font-bold text-green-500">
                {driver.driver_cagr_projected.driver_cagr_value}%
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
    </div>
  )
}

export default ExternalDrivers