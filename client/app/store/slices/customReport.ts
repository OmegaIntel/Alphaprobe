import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the state interface
interface DynamicState {
  data: any; // Dynamic data type
  loading: boolean; // Loading state
}

// Initial state
const initialState: DynamicState = {
  data: null, // Default to null since data is dynamic
  loading: false, // Default loading state
};

// Create the slice
const customReportSlice = createSlice({
  name: 'customReport',
  initialState,
  reducers: {
    // Action to set the data
    setData(state, action: PayloadAction<any>) {
      state.data = action.payload;
    },
    
    // Action to update a specific part of the data
    updateData(state, action: PayloadAction<{ path: string; value: any }>) {
      const keys = action.payload.path.split('.');
      let current = state.data;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}; // Create nested objects if they do not exist
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = action.payload.value;
    },

    // Action to remove a key from the data
    removeKey(state, action: PayloadAction<string>) {
      const keys = action.payload.split('.');
      let current = state.data;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {  
          return; // If path doesn't exist, do nothing
        }
        current = current[keys[i]];
      }

      delete current[keys[keys.length - 1]];
    },

    // Action to set the loading state
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

// Export the actions
export const { setData, updateData, removeKey, setLoading } = customReportSlice.actions;

// Export the reducer
export default customReportSlice.reducer;
