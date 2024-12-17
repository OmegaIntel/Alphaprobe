// features/documentSearchResults/documentSearchResultsSlice.js

import { createSlice } from '@reduxjs/toolkit';

export const documentSearchResultsSlice = createSlice({
  name: 'documentSearchResults',
  initialState: [],
  reducers: {
    addDocumentSearchResult: (state, action) => {
      console.log('Adding payload:', action.payload); // Log the payload
      return [action.payload]; // Add a new document result to the array
    },
    deleteDocumentSearchResult: (state, action) => {
      return state.filter(result => result.id !== action.payload.id); // Remove document result by ID
    },
    updateDocumentSearchResult: (state, action) => {
      const index = state.findIndex(result => result.id === action.payload.id);
      if (index !== -1) {
        state[index] = action.payload; // Update the document result if found
      }
    },
  },
});

// Export actions
export const { addDocumentSearchResult, deleteDocumentSearchResult, updateDocumentSearchResult } = documentSearchResultsSlice.actions;

// Export the reducer
export default documentSearchResultsSlice.reducer;
