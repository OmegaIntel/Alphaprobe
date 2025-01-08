import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DocumentSearchResult {
  id: string;
  [key: string]: any; // Additional dynamic properties
}

const initialState: DocumentSearchResult[] = [];

export const documentSearchResultsSlice = createSlice({
  name: "documentSearchResults",
  initialState,
  reducers: {
    addDocumentSearchResult(state, action: PayloadAction<DocumentSearchResult>) {
      console.log("Adding payload:", action.payload);
      return [action.payload];
    },
    deleteDocumentSearchResult(state, action: PayloadAction<{ id: string }>) {
      return state.filter((result) => result.id !== action.payload.id);
    },
    updateDocumentSearchResult(state, action: PayloadAction<DocumentSearchResult>) {
      const index = state.findIndex((result) => result.id === action.payload.id);
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
  },
});

export const {
  addDocumentSearchResult,
  deleteDocumentSearchResult,
  updateDocumentSearchResult,
} = documentSearchResultsSlice.actions;

export default documentSearchResultsSlice.reducer;
