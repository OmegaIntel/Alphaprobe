import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: null, // Placeholder for any additional response data
  selectedIndustries: [], // Array to hold selected industry objects
};

const formResponseSlice = createSlice({
  name: 'formResponse',
  initialState,
  reducers: {
    setFormResponse(state, action) {
      state.data = action.payload; // Update the response data
    },
    updateSelectedIndustries(state, action) {
      const industryCode = action.payload.industry_code;
      const industryName = action.payload.industry_name;
      // Check if the industry is already selected
      const index = state.selectedIndustries.findIndex(
        (industry) => industry.industry_code === industryCode
      );
      if (index > -1) {
        // Remove it if it is already selected (toggle off)
        state.selectedIndustries.splice(index, 1);
      } else {
        // Add it if it is not selected (toggle on)
        state.selectedIndustries.push({ industry_code: industryCode, industry_name: industryName });
      }
    },
    clearFormResponse(state) {
      state.data = null; // Clear the response data
      state.selectedIndustries = []; // Clear the selected industries
    },
  },
});

export const { setFormResponse, updateSelectedIndustries, clearFormResponse } = formResponseSlice.actions;

export default formResponseSlice.reducer;
