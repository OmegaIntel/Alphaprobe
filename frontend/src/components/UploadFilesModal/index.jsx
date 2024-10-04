import React, { useReducer } from "react";
import UploadModal from "./UploadModal/index.jsx";
import UpdateModal from "./UpdateModal/index.jsx";
import { message, notification } from "antd";
import { uploadFiles } from "../../services/uploadService.js";
import { useNavigate } from "react-router-dom";
import { initialState, reducer } from "../../reducer/modalReducer.js";

const UploadFilesModal = ({ isUploadModalVisible,
  setIsUploadModalVisible,
  isUpdateModalVisible,
  setIsUpdateModalVisible,
  dealId,
  isPublic
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

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
      dispatch({ type: "START_UPLOAD" });
      const formData = new FormData();
      formData.append("files", selectedFile.originFileObj);
      formData.append("deal_id", dealId);
      formData.append("name", baseName);
      formData.append("description", description || null);
      formData.append("category", category || null);
      formData.append("sub_category", subCategory || null);
      formData.append("tags", tags.length > 0 ? tags : null);

      const response = await uploadFiles(formData);

      if (response) {
        notification.success({ message: response.message });
        dispatch({ type: "RESET_STATE" });
        setIsUpdateModalVisible(false);
        if (!isPublic) {
          navigate(`/projects/${dealId}`);
        }
      }
    } catch (error) {
      notification.error({
        message: "Something went wrong!",
        description:
          "There was an error submitting your deal request. Please try again.",
      });
      if (!isPublic) {
        navigate(`/projects/${dealId}`);
      }
    }
  };

  const handleUploadCancel = () => {
    dispatch({ type: "RESET_STATE" });
    setIsUploadModalVisible(false);
    if (!isPublic) {
      navigate(`/projects/${dealId}`);
    }
  };

  const handleUpdateCancel = () => {
    dispatch({ type: "RESET_STATE" });
    setIsUpdateModalVisible(false);
  };

  const uploadProps = {
    fileList: state.selectedFile ? [state.selectedFile] : [],
    onChange: (info) => {
      const fileList = info.fileList;
      if (fileList.length === 0) {
        dispatch({ type: "SET_SELECTED_FILE", payload: null });
        return;
      }
      const file = fileList[fileList.length - 1];
      const isPDF =
        file.type === "application/pdf" || file.name.endsWith(".pdf");
      if (isPDF) {
        dispatch({ type: "SET_SELECTED_FILE", payload: file });
      } else {
        message.error("You can only upload PDF files!");
        dispatch({ type: "SET_SELECTED_FILE", payload: null });
      }
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
        isPublic={isPublic}
      />
      {/* Second Modal: Update File Metadata */}
      <UpdateModal
        isVisible={isUpdateModalVisible}
        onOk={handleUpdateOk}
        onCancel={handleUpdateCancel}
        state={state}
        dispatch={dispatch}
      />
    </>
  );
};

export default UploadFilesModal;
