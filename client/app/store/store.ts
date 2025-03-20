import { configureStore } from "@reduxjs/toolkit";
import dealsReducer from "./slices/dealSlice";
// import modalReducer from "./slices/modalSlice";
import formResponseReducer from "./slices/formResponseSlice";
import industryReducer from "./slices/industrySlice";
import selectedIndustriesReducer from "./slices/selectedIndustriesSlice";
import companyInsightReducer from "./slices/companyInsightsSlice";
import { documentSearchResultsSlice } from "./slices/documentSearchResultSlice";
import { chatSlice } from "./slices/chatSlice";
import customReport from "./slices/customReport"
import sidebarReducer from './slices/sideBar'
import projectReducer from './slices/projectSlice';

const store = configureStore({
  reducer: {
    // deals: dealsReducer,
    // modal: modalReducer,
    deals: dealsReducer,
    industry: industryReducer,
    selectedIndustries: selectedIndustriesReducer,
    companyInsight: companyInsightReducer,
    documentSearchResults: documentSearchResultsSlice.reducer,
    formResponse: formResponseReducer,
    customReport: customReport,
    chat: chatSlice.reducer,
    sidebar: sidebarReducer,
    project: projectReducer
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
