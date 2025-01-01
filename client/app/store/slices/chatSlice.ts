import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Interaction {
  id: string;
  query: string;
  response: string;
}

interface ChatState {
  interactions: Interaction[];
}

const initialState: ChatState = {
  interactions: [],
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addInteraction(state, action: PayloadAction<Interaction>) {
      console.log("Adding interaction:", action.payload);
      state.interactions.push(action.payload);
    },
    updateInteractionResponse(
      state,
      action: PayloadAction<{ id: string; response: string }>
    ) {
      console.log("Updating interaction:", action.payload);
      const index = state.interactions.findIndex(
        (inter) => inter.id === action.payload.id
      );
      if (index !== -1) {
        state.interactions[index].response = action.payload.response;
      } else {
        console.warn("Interaction not found for update:", action.payload.id);
      }
    },
  },
});

export const { addInteraction, updateInteractionResponse } = chatSlice.actions;

export default chatSlice.reducer;
