import { configureStore } from "@reduxjs/toolkit";
import dealsReducer from "./dealsSlice";
import modalReducer from "./modalSlice";
import formResponseReducer from "./formResponseSlice";
import industryReducer from "./industrySlice";
import selectedIndustriesReducer from "./selectedIndustriesSlice";
import companyInsightReducer from "./companyInsightsSlice";
import { documentSearchResultsSlice } from "./documentSearchResultSlice";
import { chatSlice } from "./chatSlice";
import authSliceReducer from "./auth/authSlice"
import { authMiddleware } from "./auth/authMiddleware";
import * as amplitude from '@amplitude/analytics-browser';

const store = configureStore({
  reducer: {
    deals: dealsReducer,
    modal: modalReducer,
    industry: industryReducer,
    selectedIndustries: selectedIndustriesReducer,
    companyInsight: companyInsightReducer,
    documentSearchResults: documentSearchResultsSlice.reducer,
    formResponse: formResponseReducer,
    chat: chatSlice.reducer,
    authSlice: authSliceReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authMiddleware)
});


const slicesToTrack = ['companyInsight', 'deals', 'formResponse', 'industry', 'modal', 'selectedIndustries', 'documentSearchResults', 'chat', 'authSlice'];

let previousState = slicesToTrack.reduce((acc, slice) => {
  acc[slice] = store.getState()[slice];
  return acc;
}, {});

store.subscribe(() => {
  const currentState = slicesToTrack.reduce((acc, slice) => {
    acc[slice] = store.getState()[slice];
    return acc;
  }, {});

  slicesToTrack.forEach((slice) => {
    if (previousState[slice] !== currentState[slice]) {
      // Log to Amplitude
      const resultArray = currentState[slice].summaryData;
      console.log(resultArray);
      if(typeof resultArray === 'string') {
        amplitude.track(`Yet to select an industry`, {
          previousState: previousState[slice],
          currentState: currentState[slice],
        });
      } else if(typeof resultArray === 'object' &&
        resultArray.hasOwnProperty('result') &&
        Array.isArray(resultArray.result)) { 
          amplitude.track(`A new Industry viewed - ${resultArray.result[0].report_title}`, {
            previousState: previousState[slice],
            currentState: currentState[slice],
          });
      }


      // Update previousState for this slice
      previousState[slice] = currentState[slice];
    }
  });
});



export default store;
