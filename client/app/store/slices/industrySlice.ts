import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IndustryState {
  summaryData: string;
  loading: boolean;
  error: string | null;
}

const initialState: IndustryState = {
  summaryData: "Select an industry to view report",
  loading: false,
  error: null,
};

const industrySlice = createSlice({
  name: "industry",
  initialState,
  reducers: {
    setSummaryData(state, action: PayloadAction<string>) {
      state.summaryData = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state) {
      state.loading = true;
    },
    setError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearSummaryData(state) {
      state.summaryData = "Select an industry to view report";
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setSummaryData, setLoading, setError, clearSummaryData } =
  industrySlice.actions;

export default industrySlice.reducer;
