import React, { useReducer } from "react";
import { useModal } from "./ModalContext.js";
import UploadModal from "./UploadModal/index.jsx";
import UpdateModal from "./UpdateModal/index.jsx";
import { notification } from "antd";
import { uploadFiles } from "../../services/uploadService.js";

const initialState = {
  selectedFile: null,
  baseName: "",
  extension: "",
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
      const fullName = action.payload.name;
      const dotIndex = fullName.lastIndexOf(".");
      return {
        ...state,
        selectedFile: action.payload,
        baseName: fullName.substring(0, dotIndex),
        extension: fullName.substring(dotIndex),
      };
    case "SET_FILE_NAME":
      return { ...state, baseName: action.payload };
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
    dealId,
  } = useModal();
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleUploadOk = () => {
    setIsUploadModalVisible(false);
    if (state.selectedFile) {
      setIsUpdateModalVisible(true);
    }
  };
  const handleUpdateOk = async () => {
    const { baseName, selectedFile, description, category, subCategory, tags } =
      state;

    if (!baseName || !selectedFile) {
      return notification.error({
        message: "File Upload Incomplete",
        description:
          "Please select a file and provide a valid file name before proceeding.",
      });
    }

    try {
      const formData = new FormData();
      formData.append("files", selectedFile.originFileObj);
      formData.append("deal_id", dealId);
      formData.append("name", baseName);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("sub_category", subCategory);
      formData.append("tags", tags);

      const response = await uploadFiles(formData);

      if (response) {
        notification.success({ message: response.message });
        dispatch({ type: "RESET_STATE" });
        setIsUpdateModalVisible(false);
      }
    } catch (error) {
      notification.error({
        message: "Something went wrong!",
        description:
          "There was an error submitting your deal request. Please try again.",
      });
    }
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
        payload: info.fileList[info.fileList.length - 1],
      });
    },
    multiple: false,
  };

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
