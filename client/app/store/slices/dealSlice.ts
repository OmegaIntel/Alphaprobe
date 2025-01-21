import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Deal {
  id: string;
  name: string;
  [key: string]: any; // Extendable for additional deal properties
}

interface DealsState {
  dealId: string | null;
  selectedCategory: string | null;
  deals: Deal[];
  todos: any[]; // Adjust type if todos have a specific structure
  projects: any[]; // Adjust type if projects have a specific structure
}

const initialState: DealsState = {
  dealId: null,
  selectedCategory: null,
  deals: [],
  todos: [],
  projects: [],
};

const dealsSlice = createSlice({
  name: "deals",
  initialState,
  reducers: {
    setDealId(state, action: PayloadAction<string | null>) {
      state.dealId = action.payload;
    },
    setSelectedCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
    },
    setDeals(state, action: PayloadAction<Deal[]>) {
      state.deals = action.payload;
    },
    setTodos(state, action: PayloadAction<any[]>) {
      state.todos = action.payload;
    },
    setProjects(state, action: PayloadAction<any[]>) {
      state.projects = action.payload;
    },
    updateDealName(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload;
      const deal = state.deals.find((deal) => deal.id === id);
      if (deal) {
        deal.name = name;
      }
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
  updateDealName,
} = dealsSlice.actions;

// Export reducer
export default dealsSlice.reducer;
