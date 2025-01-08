import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SelectedIndustriesState {
  value: string[];
}

const initialState: SelectedIndustriesState = {
  value: [],
};

const selectedIndustriesSlice = createSlice({
  name: "selectedIndustries",
  initialState,
  reducers: {
    setSelectedIndustries(state, action: PayloadAction<string[]>) {
      state.value = action.payload;
    },
  },
});

export const { setSelectedIndustries } = selectedIndustriesSlice.actions;

export default selectedIndustriesSlice.reducer;
