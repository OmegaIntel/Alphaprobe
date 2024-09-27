import React, { useReducer } from "react";
import { useModal } from "./ModalContext.js";
import UploadModal from "./UploadModal/index.jsx";
import UpdateModal from "./UpdateModal/index.jsx";
import { message, notification } from "antd";
import { uploadFiles } from "../../services/uploadService.js";
import { useNavigate } from "react-router-dom";
import { initialState, reducer } from "../../reducer/modalReducer.js";

const UploadFilesModal = () => {
  const {
    isUploadModalVisible,
    setIsUploadModalVisible,
    isUpdateModalVisible,
    setIsUpdateModalVisible,
    dealId,
  } = useModal();
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
        navigate(`/projects/${dealId}`);
      }
    } catch (error) {
      notification.error({
        message: "Something went wrong!",
        description:
          "There was an error submitting your deal request. Please try again.",
      });
      navigate(`/projects/${dealId}`);
    }
  };

  const handleUploadCancel = () => {
    dispatch({ type: "RESET_STATE" });
    setIsUploadModalVisible(false);
    navigate(`/projects/${dealId}`);
  };

  const handleUpdateCancel = () => {
    dispatch({ type: "RESET_STATE" });
    setIsUpdateModalVisible(false);
  };

  const uploadProps = {
    fileList: state.selectedFile ? [state.selectedFile] : [],
    onChange: (info) => {
      const isValidFile =
        info.fileList.length > 0 &&
        (info.fileList[0].type === "application/pdf" ||
          info.fileList[0].name.endsWith(".pdf"));

      if (isValidFile) {
        dispatch({
          type: "SET_SELECTED_FILE",
          payload: info.fileList[info.fileList.length - 1],
        });
      } else {
        message.error("You can only upload PDF files!");
        dispatch({
          type: "SET_SELECTED_FILE",
          payload: null,
        });
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
