import React from 'react'

const SimpleList = ({industries}) => {
  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400 mx-10">
    {industries.length > 0 ? (
      <ul className="list-disc list-inside">
        {industries.map((industry, index) => (
          <li key={index} className="mb-1">{industry}</li>
        ))}
      </ul>
    ) : (
      <p>No similar industries available.</p>
    )}
  </div>
  )
}

export default SimpleList