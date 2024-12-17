import { configureStore } from "@reduxjs/toolkit";
import dealsReducer from "./dealsSlice";
import modalReducer from "./modalSlice";
import formResponseReducer from "./formResponseSlice";
import industryReducer from "./industrySlice";
import selectedIndustriesReducer from "./selectedIndustriesSlice";
import companyInsightReducer from "./companyInsightsSlice";
import { documentSearchResultsSlice } from "./documentSearchResultSlice";
import { chatSlice } from "./chatSlice";

const store = configureStore({
  reducer: {
    deals: dealsReducer,
    modal: modalReducer,
    industry: industryReducer,
    selectedIndustries: selectedIndustriesReducer,
    companyInsight: companyInsightReducer,
    documentSearchResults: documentSearchResultsSlice.reducer,
    formResponse: formResponseReducer,
    chat: chatSlice.reducer,
  },
});

export default store;
