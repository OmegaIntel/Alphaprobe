import { configureStore } from "@reduxjs/toolkit";
import dealsReducer from "./dealsSlice";
import modalReducer from "./modalSlice";
const store = configureStore({
  reducer: { deals: dealsReducer, modal: modalReducer },
});

export default store;
