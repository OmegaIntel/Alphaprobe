import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Industry {
  industry_code: string;
  industry_name: string;
}

interface FormResponseState {
  data: any | null;
  selectedIndustries: Industry[];
}

const initialState: FormResponseState = {
  data: null,
  selectedIndustries: [],
};

const formResponseSlice = createSlice({
  name: "formResponse",
  initialState,
  reducers: {
    setFormResponse(state, action: PayloadAction<any>) {
      state.data = action.payload;
    },
    updateSelectedIndustries(state, action: PayloadAction<Industry>) {
      const { industry_code, industry_name } = action.payload;
      const index = state.selectedIndustries.findIndex(
        (industry) => industry.industry_code === industry_code
      );
      if (index > -1) {
        state.selectedIndustries.splice(index, 1);
      } else {
        state.selectedIndustries.push({ industry_code, industry_name });
      }
    },
    clearFormResponse(state) {
      state.data = null;
      state.selectedIndustries = [];
    },
  },
});

export const { setFormResponse, updateSelectedIndustries, clearFormResponse } =
  formResponseSlice.actions;

export default formResponseSlice.reducer;
