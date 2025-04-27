import React, { useState } from "react";
import FileUpload from "~/components/UploadFile/UploadFile"; // Update with your actual path

const UploadSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); 
     
    console.log("Searching for:", searchQuery);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Research Documents</h2>
      
      {/* Search bar */}
      <form onSubmit={handleSearch}>
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input 
              type="search" 
              className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Search for company, reports, or documents..." 
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button 
              type="submit" 
              className="absolute right-2.5 bottom-2.5 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-white"
            >
              Search
            </button>
          </div>
        </div>
      </form>
      
      {/* Upload documents section */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Upload Documents</h3>
        <FileUpload onFilesUploaded={(files) => console.log(files)} />
      </div>
    </div>
  );
};

export default UploadSearch;