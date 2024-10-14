import { createSlice } from "@reduxjs/toolkit";

const modalSlice = createSlice({
  name: "modal",
  initialState: {
    isUploadModalVisible: false,
    isUpdateModalVisible: false,
    isFileUploadModule: false,
  },
  reducers: {
    setIsUploadModalVisible(state, action) {
      state.isUploadModalVisible = action.payload;
    },
    setIsUpdateModalVisible(state, action) {
      state.isUpdateModalVisible = action.payload;
    },
    setIsFileUploadModule(state, action) {
      state.isFileUploadModule = action.payload;
    },
  },
});

export const {
  setIsUploadModalVisible,
  setIsUpdateModalVisible,
  setIsFileUploadModule,
} = modalSlice.actions;

export default modalSlice.reducer;
