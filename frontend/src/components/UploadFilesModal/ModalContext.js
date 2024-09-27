import React, { createContext, useState, useContext } from "react";

// Create the context
const ModalContext = createContext();

// Create a custom hook to use the ModalContext
export const useModal = () => useContext(ModalContext);

// Create the provider component
export const ModalProvider = ({ children }) => {
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [dealId, setDealId] = useState(null);
  const [deals, setDeals] = useState([]);

  return (
    <ModalContext.Provider
      value={{
        isUploadModalVisible,
        setIsUploadModalVisible,
        isUpdateModalVisible,
        setIsUpdateModalVisible,
        dealId,
        setDealId,
        deals,
        setDeals
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
