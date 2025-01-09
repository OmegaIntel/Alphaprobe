import { configureStore } from "@reduxjs/toolkit";
// import dealsReducer from "./slices/dealsSlice";
// import modalReducer from "./slices/modalSlice";
import formResponseReducer from "./slices/formResponseSlice";
import industryReducer from "./slices/industrySlice";
import selectedIndustriesReducer from "./slices/selectedIndustriesSlice";
import companyInsightReducer from "./slices/companyInsightsSlice";
import { documentSearchResultsSlice } from "./slices/documentSearchResultSlice";
import { chatSlice } from "./slices/chatSlice";
import authSliceReducer from "./slices/authSlice"
import paymentSliceReducer from "./slices/paymentSlice"


const store = configureStore({
  reducer: {
    // deals: dealsReducer,
    // modal: modalReducer,
    industry: industryReducer,
    selectedIndustries: selectedIndustriesReducer,
    companyInsight: companyInsightReducer,
    documentSearchResults: documentSearchResultsSlice.reducer,
    formResponse: formResponseReducer,
    chat: chatSlice.reducer,
    auth: authSliceReducer,
    payment: paymentSliceReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
