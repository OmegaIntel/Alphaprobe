import React, { useState, useRef } from "react";
import { API_BASE_URL, token } from "../../services";
import { useDispatch } from "react-redux";
import { notification } from "antd";
import { setSummaryData, setError } from "../../redux/industrySlice";
import Fuse from "fuse.js";
import SearchIcon from "@mui/icons-material/Search";
import { setFormResponse } from "../../redux/formResponseSlice";

const FuzzySearch = ({ section, industry , setIndustry }) => {
  const dispatch = useDispatch(); // Initialize dispatch

  // Sample data for searching
  const fuseRef = useRef([]);

  // Fuse.js setup
  const options = {
    keys: ["name"],
    threshold: 0.7, // Controls fuzziness; lower is stricter
  };

  fuseRef.current = new Fuse(fuseRef.current, options);

  // State for search input and suggestions
  const queryRef = useRef("");
  const [suggestions, setSuggestions] = useState([]);
  const [industryName, setIndustryName] = useState("");
  const [industryCode, setIndustryCode] = useState("");

  // Search button onclick handling
  const handleSearch = async (e) => {
    e.preventDefault();

    // Prepare the payload
    const payload = {
      data: {
        source: "IBIS",
        industry_name: industryName,
        industry_code: industryCode,
      },
    };

    // Check if the `industry` prop is passed
    if (industry) {
      const industryToAdd = {
        industry_code: payload.data.industry_code,
        industry_name: payload.data.industry_name,
      };

      // Push to the `industry` array
      setIndustry((prevIndustry) => [...prevIndustry, industryToAdd]);
    } else {
      const PreloadPayload = {
        result: [
          {
            industry_code: payload.data.industry_code,
            industry_name: payload.data.industry_name,
          },
        ],
      }
      // Dispatch `setFormResponse` to store the payload
      dispatch(setFormResponse(PreloadPayload));
    }

    try {
      // Send the request to the API
      const response = await fetch(`${API_BASE_URL}/api/industry-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.result.length === 0) {
        notification.error({
          message: "Please enter valid industry!",
          description:
            "There was an error fetching your request. Please try again.",
        });
      }

      console.log("Search payload", payload);
      console.log("Response:", result);

      if (result.result) {
        dispatch(setSummaryData(result));
      } else {
        dispatch(setError("No result found in API response"));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Handle input change and update suggestions
  const handleInputChange = async (e) => {
    e.preventDefault();
    const value = e.target.value;
    queryRef.current = value;
    setIndustryName(queryRef.current);
    console.log(value);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fuzzy-search?query=${queryRef.current}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }
      const data = await response.json();
      console.log(data);
      fuseRef.current.setCollection(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }

    if (value) {
      const results = fuseRef.current
        .search(value)
        .map((result) => result.item);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleClickChange = (item) => {
    selectSuggestion(item.name);
    setIndustryName(item.name);
    setIndustryCode(item.code);
  };

  // Handle suggestion selection
  const selectSuggestion = (item) => {
    queryRef.current = item;
    setSuggestions([]);
  };

  return (
    <div
      style={{ position: "relative", margin: "0 auto", marginRight: "none" }}
    >
      <form onSubmit={handleSearch}>
        <div style={{ display: "inline-flex" }}>
          <input
            type="text"
            name="fuzzySearch"
            value={queryRef.current}
            onChange={handleInputChange}
            placeholder={section}
            className="p-2 rounded-xl w-40 border border-gray-600 h-10 bg-[#0d0d0d] text-sm "
          />
          <button
            type="submit"
            className="ml-2 p-2 bg-[#fcfcfc] text-[#121212] rounded-xl  h-10 hover:bg-[#121212] hover:text-[#fcfcfc] transition-all duration-200 ease-out"
          >
            <SearchIcon />
          </button>
        </div>
      </form>
      {suggestions.length > 0 && (
        <div
          style={{
            border: "1px solid black",
            maxHeight: "12rem",
            overflowY: "auto",
            position: "absolute",
            backgroundColor: "white",
            width: "100%",
            zIndex: 1,
            color: "black",
            borderRadius: "0.75rem",
          }}
        >
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleClickChange(item)}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderRadius: "0.75rem",
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FuzzySearch;