// dealsSlice.js
import { createSlice } from "@reduxjs/toolkit";
const dealsSlice = createSlice({
  name: "deals",
  initialState: {
    dealId: null,
    selectedCategory: null,
    deals: [],
    todos: [],
    projects: [],
  },
  reducers: {
    setDealId(state, action) {
      state.dealId = action.payload;
    },
    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload;
    },
    setDeals(state, action) {
      state.deals = action.payload;
    },
    setTodos(state, action) {
      state.todos = action.payload;
    },
    setProjects(state, action) {
      state.projects = action.payload;
    },
  },
});

// Export actions
export const {
  setDealId,
  setDeals,
  setSelectedCategory,
  setTodos,
  setProjects,
} = dealsSlice.actions;

// Export reducer
export default dealsSlice.reducer;
