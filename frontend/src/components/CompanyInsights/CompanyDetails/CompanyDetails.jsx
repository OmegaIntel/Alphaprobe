import React, { useEffect } from "react";
import CompanyDetailsComponent from "./CompanyDetailsComponent";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompanyInsightSuccess } from "../../../redux/companyInsightsSlice";

const tempData = {
  "result": {
    "company_name": "Google",
    "company_description": "Google is a multinational corporation that specializes in Internet-related services and organizes the world’s information. It focuses on search engine technology, online advertising, cloud computing, computer software, quantum computing, e-commerce, artificial intelligence, and consumer electronics.",
    "company_headquareter_location": "Mountain View, CA",
    "company_incorporation_date": "1998",
    "company_website": "https://www.google.com",
    "company_employee_count": "100K-9.9M",
    "company_phone_number": null,
    "company_ownership status": "Public",
    "company_investors": [
      "Angel Investors LP",
      "Kleiner Perkins"
    ],
    "company_structure": "Publicly Held",
    "company_competitors": [
      "DuckDuckGo",
      "Aera Technology",
      "Saama"
    ],
    "company_contact_email": "google@google.com",
    "company_linkedin_url": "https://www.linkedin.com/company/google",
    "company_product1_name": "Google Search",
    "company_product1_description": "A search engine that organizes and provides access to a wide range of information from various sources.",
    "company_product2_name": "Google Ads",
    "company_product2_description": "An online advertising platform that allows businesses to create ads and reach potential customers through Google's network.",
    "company_product3_name": "Google Chrome",
    "company_product3_description": "A web browser designed for speed, security, and ease of use, available across multiple platforms.",
    "company_product4_name": null,
    "company_product4_description": null,
    "company_primary_industry": "Software Development",
    "company_industry_verticals": [
      "Cloud Computing",
      "Search Engine Optimization (SEO)"
    ],
    "company_ceo": "Sundar Pichai",
    "company_founder": [
      "Larry Page",
      "Sergey Brin"
    ],
    "company_revenue": "$100-1000B",
    "company_gross_margin": null,
    "company_total_funding": "$1.7B",
    "company_last_funding_date": "Jun 7, 1999",
    "company_future_projections": "Growing"
  }
};

const CompanyDetails = () => {
  //Accessing company insights data from Redux state with fallback to an empty object
  const data = useSelector((state) => state.companyInsight?.data || null);
  console.log("data from redux for insights", data);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCompanyInsightSuccess());
  }, [dispatch]);
  
  // Ensure that data is defined and has the expected structure
  if (!data) {
    return <p>Search For Company...</p>;  // Fallback if no data or essential field is missing
  }

  return (
    <div>
      {/* Render CompanyDetailsComponent when data is available */}
      <CompanyDetailsComponent data={tempData} />
    </div>
  );
};

export default CompanyDetails;