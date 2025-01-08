import React from "react";
import {
  Route,
  Routes,
} from "react-router-dom";
import "./App.css";
import CheckoutForm from "./components/Checks/CheckoutForm";
import AutoLogin from "./components/Checks/AutoLogin";
import AutoRegister from "./components/Checks/AutoRegister";
import AutoDashboard from "./components/Checks/AutoDashboard";
import CallbackPage from "./components/Login/CallbackPage";
import { Auth0Provider } from "@auth0/auth0-react";
import Categories from "./components/projectHeaders/categories";
import DocumentsWrapper from "./components/FileUploadComponent/wrapper";
import * as amplitude from "@amplitude/analytics-browser";
import DocumentAnalysisLayout from "./components/DocumentAnalysis/DocumentAnalysisLayout";
import Main from "./components/LandingPage/Main";
import Home from "./components/LandingPage/LandingPageComponents/Home/Home";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

amplitude.init('b07260e647c7c3cc3c25aac93aa17db8', undefined, {
  defaultTracking: true, // Automatically tracks page views and session properties
});

const stripePromise = loadStripe('pk_test_51QYEgCJNJeCsZb59NImX4wkZFUIIoVh6qSQ06uxHSpxkO6RnVdZ3ZlOoEjIwy7TXvH1CAh68hejLtLCgTPnQHqaj00k2MYGK3N');

const App = () => {  
  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin + "/dashboard",
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
    >
      <Elements stripe={stripePromise}>
        <Routes>
          <Route path="/guest/:id" element={<DocumentsWrapper />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/register" element={<AutoRegister />} />
          <Route path="/login" element={<AutoLogin />} />
          <Route path="/dashboard" element={<AutoDashboard component={Categories} />} />
          <Route path="/document" element={<AutoDashboard component={DocumentAnalysisLayout} />} />
          <Route path="/projects" element={<AutoDashboard component={Categories} />} />
          <Route path="/projects/:id" element={<AutoDashboard component={Categories} />} />
          <Route path="/checkout" element={<CheckoutForm />} />
          <Route path="/" element={<Main><Home /></Main>} />
          <Route path="*" element={<AutoLogin />} />
        </Routes>
      </Elements>
    </Auth0Provider>
  );
};

export default App;
