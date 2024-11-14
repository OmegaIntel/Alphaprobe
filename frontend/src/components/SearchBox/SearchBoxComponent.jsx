import React, { useState } from "react";
import { API_BASE_URL, token } from "../../services";

const SearchBoxComponent = ({section}) => {
  const [companyName, setCompanyName] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    // Prepare the payload
    const payload = {
      data: {
        company_name: companyName,
      },
    };

    try {
      // Send the request to the API
      const response = await fetch(`${API_BASE_URL}/api/company-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Search payload".payload);
      console.log("Response:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  };
 
  return (
    <div className="search-bar">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder={section}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="border border-[#2e2e2e] w-80 px-4 py-2 bg-[#0d0d0d]  text-[#7a7a7a] rounded-2xl"
        />
        <button type="submit" className="ml-2 p-2 bg-[#fcfcfc] text-[#121212] rounded-xl w-32 h-10 hover:bg-[#121212] hover:text-[#fcfcfc] transition-all duration-200 ease-out">
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBoxComponent;
