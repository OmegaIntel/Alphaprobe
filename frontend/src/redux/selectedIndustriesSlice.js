// selectedIndustriesSlice.js
import { createSlice } from '@reduxjs/toolkit';

const selectedIndustriesSlice = createSlice({
  name: 'selectedIndustries',
  initialState: {
    value: [],
  },
  reducers: {
    setSelectedIndustries: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { setSelectedIndustries } = selectedIndustriesSlice.actions;
export default selectedIndustriesSlice.reducer;