import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Response {
  agent_response: string;
  metadata_content_pairs: any; // Type this based on your data structure
}

interface Interaction {
  id: string;
  query: string;
  response?: Response;
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
    addInteraction(state, action: PayloadAction<{ id: string; query: string }>) {
      console.log("Adding interaction:", action.payload);
      state.interactions.push({
        id: action.payload.id,
        query: action.payload.query
      });
    },
    updateInteractionResponse(
      state,
      action: PayloadAction<{ id: string; response: Response }>
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
    resetInteractions(state) {
      state.interactions = [];
    }
  },
});

export const { addInteraction, updateInteractionResponse, resetInteractions } = chatSlice.actions;

export default chatSlice.reducer;