import { configureStore } from "@reduxjs/toolkit";
import dealsReducer from "./dealsSlice";
import modalReducer from "./modalSlice";
import formResponseReducer from "./formResponseSlice";
import industryReducer from "./industrySlice";

const store = configureStore({
  reducer: {
    deals: dealsReducer,
    modal: modalReducer,
    industry: industryReducer, 
    formResponse: formResponseReducer,
  },
});

export default store;
