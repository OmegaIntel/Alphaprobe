import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  userId: string | null; // User ID can be a string or null
}

const initialState: UserState = {
  userId: null, // Initially, no user is logged in
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload; // Set the logged-in user's ID
    },
    clearUserId: (state) => {
      state.userId = null; // Clear the user ID (e.g., on logout)
    },
  },
});

export const { setUserId, clearUserId } = userSlice.actions; // Export actions
export default userSlice.reducer; // Export the reducer
