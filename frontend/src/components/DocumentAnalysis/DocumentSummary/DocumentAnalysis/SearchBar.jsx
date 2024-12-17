import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addDocumentSearchResult } from '../../../../redux/documentSearchResultSlice';
import { API_BASE_URL, token } from '../../../../services/index';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return; // Prevent empty searches
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rag-search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(addDocumentSearchResult(data)); // Assuming the API returns the document data directly
      } else {
        throw new Error('Failed to fetch results');
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className='flex w-full justify-center space-x-2'>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search documents..."
        className="border rounded p-2 text-black"
      />
      <button onClick={handleSearch} className="bg-blue-500 p-2 rounded">
        Search
      </button>
    </div>
  );
};

export default SearchBar;
