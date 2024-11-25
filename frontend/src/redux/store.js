import { configureStore } from "@reduxjs/toolkit";
import dealsReducer from "./dealsSlice";
import modalReducer from "./modalSlice";
import formResponseReducer from "./formResponseSlice";
import industryReducer from "./industrySlice";
import selectedIndustriesReducer from "./selectedIndustriesSlice"
import companyInsightReducer from "./companyInsightsSlice"

const store = configureStore({
  reducer: {
    deals: dealsReducer,
    modal: modalReducer,
    industry: industryReducer,
    selectedIndustries: selectedIndustriesReducer,
    companyInsight: companyInsightReducer,
    formResponse: formResponseReducer,
  },
});

export default store;
