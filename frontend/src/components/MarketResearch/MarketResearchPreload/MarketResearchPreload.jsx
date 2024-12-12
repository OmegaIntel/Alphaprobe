import React from 'react'
import FuzzySearch from '../../SearchBox/FuzzySearch';

const MarketResearchPreload = () => {
  return (
    <div className=' w-1/3 h-96 flex flex-col justify-center items-center'>
 <FuzzySearch 
    styles={{
        container: "mt-4 w-full",
        input: "bg-gray-800 w-[30rem] text-black",
        button: "bg-gray-800 text-white",
        suggestions: "bg-gray-50",
        suggestionItem: "hover:bg-gray-200",
      }} 
      />
      <p className='mt-10 text-xl text-center w-full'>Search for Industries</p>
      </div>
  )
}

export default MarketResearchPreload;