import React from 'react'
import SearchBoxComponent from './SearchBoxComponent'
import FuzzySearch from './FuzzySearch.jsx'

const SearchBox = ({section}) => {
  return (
    <div>
      {section.toLowerCase() === "market research" ? (
        <FuzzySearch section={section} />
      ) : (
        <SearchBoxComponent section={section} />
      )}
    </div>
  )
}

export default SearchBox