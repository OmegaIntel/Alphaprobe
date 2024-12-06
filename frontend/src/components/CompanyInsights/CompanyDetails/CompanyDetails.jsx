import React, { useEffect } from "react";
import CompanyDetailsComponent from "./CompanyDetailsComponent";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompanyInsightSuccess, clearCompanyInsight } from "../../../redux/companyInsightsSlice";
import PreloadingScreen from "../PreloadingScreen/PreloadingScreen";

const CompanyDetails = () => {
  // Accessing company insights data from Redux state with fallback to null
  const data = useSelector((state) => state.companyInsight?.data || null);
  console.log("data from redux for insights", data);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCompanyInsightSuccess());
  }, [dispatch]);

  // Function to handle clearing data and returning to PreloadingScreen
  const handleClose = () => {
    dispatch(clearCompanyInsight()); // Clear data by dispatching an action
  };

  // Ensure that data is defined and has the expected structure
  if (!data) {
    return (
      <div>
        <PreloadingScreen />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4  text-white rounded-full p-2 hover:bg-red-600"
        onClick={handleClose}
      >
        &times;
      </button>
      {/* Render CompanyDetailsComponent */}
      <CompanyDetailsComponent data={data} />
    </div>
  );
};

export default CompanyDetails;
