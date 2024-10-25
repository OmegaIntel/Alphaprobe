import { configureStore } from "@reduxjs/toolkit";
import dealsReducer from "./dealsSlice";
import modalReducer from "./modalSlice";
import formResponseReducer from "./formResponseSlice";

const store = configureStore({
  reducer: {
    deals: dealsReducer,
    modal: modalReducer,
    formResponse: formResponseReducer,
  },
});

export default store;
