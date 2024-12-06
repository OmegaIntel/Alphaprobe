import React, { useState, useRef } from "react";
import { API_BASE_URL, token } from "../../services";
import { useDispatch } from "react-redux";
import { notification } from "antd";
import { setSummaryData, setError } from "../../redux/industrySlice";
import Fuse from "fuse.js";
import SearchIcon from "@mui/icons-material/Search";
import { setFormResponse } from "../../redux/formResponseSlice";

const FuzzySearch = ({ section, industry, setIndustry, styles = {} }) => {
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
      setIndustry((prevIndustry) => [...prevIndustry, industryToAdd]);
    } else {
      const PreloadPayload = {
        result: [
          {
            industry_code: payload.data.industry_code,
            industry_name: payload.data.industry_name,
          },
        ],
      };
      dispatch(setFormResponse(PreloadPayload));
    }

    try {
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
      className={`relative mx-auto ${styles?.container || ""}`}
    >
      <form onSubmit={handleSearch}>
        <div className="inline-flex">
          <input
            type="text"
            name="fuzzySearch"
            value={queryRef.current}
            onChange={handleInputChange}
            placeholder={section}
            className={`p-2 rounded-xl w-40 border border-gray-600 h-10 bg-[#0d0d0d] text-sm ${styles?.input || ""}`}
          />
          <button
            type="submit"
            className={`ml-2 p-2 bg-[#fcfcfc] text-[#121212] rounded-xl h-10 hover:bg-[#121212] hover:text-[#fcfcfc] transition-all duration-200 ease-out ${styles?.button || ""}`}
          >
            <SearchIcon />
          </button>
        </div>
      </form>
      {suggestions.length > 0 && (
        <div
          className={`absolute border border-black max-h-48 overflow-y-auto bg-white w-full z-10 text-black rounded-xl ${styles?.suggestions || ""}`}
        >
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleClickChange(item)}
              className={`p-2 cursor-pointer rounded-xl ${styles?.suggestionItem || ""}`}
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
