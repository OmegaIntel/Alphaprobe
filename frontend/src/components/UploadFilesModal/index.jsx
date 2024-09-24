import React, { useReducer } from "react";
import { useModal } from "./ModalContext.js";
import UploadModal from "./UploadModal/index.jsx";
import UpdateModal from "./UpdateModal/index.jsx";

const initialState = {
  selectedFile: null,
  tags: [],
  category: null,
  subCategory: null,
  description: "",
  newTag: "",
  isDocumentInfoVisible: false,
};
const reducer = (state, action) => {
  switch (action.type) {
    case "SET_SELECTED_FILE":
      return { ...state, selectedFile: action.payload };
    case "ADD_TAG":
      if (!state.tags.includes(action.payload) && state.newTag !== "") {
        return { ...state, tags: [...state.tags, action.payload], newTag: "" };
      }
      return state;
    case "REMOVE_TAG":
      return {
        ...state,
        tags: state.tags.filter((tag) => tag !== action.payload),
      };
    case "SET_NEW_TAG":
      return { ...state, newTag: action.payload };
    case "TOGGLE_DOCUMENT_INFO":
      return { ...state, isDocumentInfoVisible: !state.isDocumentInfoVisible };
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "SET_SUBCATEGORY":
      return { ...state, subCategory: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
};
const UploadFilesModal = () => {
  const {
    isUploadModalVisible,
    setIsUploadModalVisible,
    isUpdateModalVisible,
    setIsUpdateModalVisible,
  } = useModal();
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleUploadOk = () => {
    setIsUploadModalVisible(false);
    if (state.selectedFile) {
      setIsUpdateModalVisible(true);
    }
  };

  const handleUpdateOk = () => {
    setIsUpdateModalVisible(false);
    // Add logic to save file details (name/category)
  };

  const handleUploadCancel = () => {
    dispatch({ type: "RESET_STATE" });
    setIsUploadModalVisible(false);
  };

  const handleUpdateCancel = () => {
    dispatch({ type: "RESET_STATE" });
    setIsUpdateModalVisible(false);
  };

  const uploadProps = {
    fileList: state.selectedFile ? [state.selectedFile] : [],
    onChange: (info) => {
      dispatch({
        type: "SET_SELECTED_FILE",
        payload: info.fileList[0],
      });
    },
    multiple: false,
  };
  console.log(state);

  return (
    <>
      {/* First Modal: File Upload */}
      <UploadModal
        isVisible={isUploadModalVisible}
        onOk={handleUploadOk}
        onCancel={handleUploadCancel}
        uploadProps={uploadProps}
        selectedFile={state.selectedFile}
      />
      {/* Second Modal: Update File Metadata */}
      {state.selectedFile && (
        <UpdateModal
          isVisible={isUpdateModalVisible}
          onOk={handleUpdateOk}
          onCancel={handleUpdateCancel}
          state={state}
          dispatch={dispatch}
        />
      )}
    </>
  );
};

export default UploadFilesModal;
