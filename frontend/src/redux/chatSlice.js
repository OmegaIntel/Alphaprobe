// features/chat/chatSlice.js

import { createSlice } from '@reduxjs/toolkit';
import {v4 as uuidv4} from 'uuid';

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    interactions: []
  },
  reducers: {
    addInteraction: (state, action) => {
      // Pushes a new interaction with an initial response placeholder
      console.log('Adding interaction:', action.payload);
      state.interactions.push({
        id: action.payload.id, // Creating a unique ID for the interaction
        query: action.payload.query,
        response: action.payload.response || "Generating report..."
      });
    },
    updateInteractionResponse: (state, action) => {
      console.log('Updating interaction:', action.payload);
      const index = state.interactions.findIndex(inter => inter.id === action.payload.id);
      if (index !== -1) {
        state.interactions[index].response = action.payload.response;
      } else {
        console.warn('Interaction not found for update:', action.payload.id);
      }
    },    
  },
});

export const { addInteraction, updateInteractionResponse } = chatSlice.actions;

export default chatSlice.reducer;
