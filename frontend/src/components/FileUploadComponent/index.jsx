import React, { useEffect, useReducer, useState } from "react";
import { Button, Empty, Modal, notification, Spin } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  deleteDocument,
  fetchAllDocument,
  fetchDocumentById,
  updateDocument,
} from "../../services/uploadService";
import { initialState, reducer } from "../../reducer/modalReducer";
import { truncateDescription } from "../../utils/truncateDescription";
import UpdateModal from "../UploadFilesModal/UpdateModal";
import DiligenceDocumentsModal from "../requestDocuments";
import { useDispatch, useSelector } from "react-redux";
import { setIsUploadModalVisible } from "../../redux/modalSlice";

const FileUploadComponent = ({ isPublic = false }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [files, setFiles] = useState([]);
  const [documentId, setDocumentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdateModal, setIsUpdateModal] = useState(false);
  const [open, setOpen] = useState(false);

  const { isUploadModalVisible, isUpdateModalVisible } = useSelector(
    (state) => state.modal
  );
  const { dealId } = useSelector((state) => state.deals);

  const reduxDispatch = useDispatch();

  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        const res = await fetchAllDocument(dealId);
        if (res) setFiles(res.documents);
        else setFiles([]);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (dealId) {
      fetchDocumentData();
    }
  }, [dealId, isUpdateModalVisible, isUpdateModal]);

  const handleEditClick = async (fileId) => {
    try {
      const res = await fetchDocumentById(fileId);
      if (res) {
        dispatch({ type: "SET_FILE_NAME", payload: res.name });
        dispatch({ type: "SET_DESCRIPTION", payload: res.description });
        dispatch({ type: "SET_CATEGORY", payload: res.category });
        dispatch({ type: "SET_SUBCATEGORY", payload: res.sub_category });
        dispatch({ type: "SET_TAGS", payload: res.tags });
        setDocumentId(res.id);
      }
      setIsUpdateModal(true);
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };
  const showDeleteConfirm = (fileId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this document?",
      content: "Once deleted, you will not be able to recover this document.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: () => handleDelete(fileId),
    });
  };

  const handleUpdateOk = async () => {
    const { baseName, description, category, subCategory, tags } = state;

    if (!baseName) {
      return notification.error({
        message: "File Upload Incomplete",
        description: "Please provide a valid file name before proceeding.",
      });
    }

    try {
      const formData = new FormData();
      formData.append("name", baseName);
      formData.append("description", description || null);
      formData.append("category", category || null);
      formData.append("sub_category", subCategory || null);
      formData.append("tags", tags.length > 0 ? tags : null);

      const response = await updateDocument(documentId, formData);

      if (response) {
        notification.success({ message: response.message });
        dispatch({ type: "RESET_STATE" });
        setIsUpdateModal(false);
      }
    } catch (error) {
      notification.error({
        message: "Something went wrong!",
        description:
          "There was an error submitting your deal request. Please try again.",
      });
    }
  };
  const handleDelete = async (fileId) => {
    try {
      const response = await deleteDocument(fileId);
      if (response) {
        notification.success({
          message: response.detail,
        });
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "There was an error deleting the document.",
      });
    }
  };
  const handleUpdateCancel = () => {
    dispatch({ type: "RESET_STATE" });
    setIsUpdateModal(false);
  };
  const onRequestClose = () => {
    setOpen(false);
  };
  return (
    <div className="bg-[#151518] flex flex-col w-full flex-grow h-screen overflow-auto ml-1">
      <DiligenceDocumentsModal
        isOpen={open}
        onRequestClose={onRequestClose}
        dealId={dealId}
      />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">File Uploads</h2>
          <div className="flex flex-row gap-4">
            <button
              onClick={() =>
                reduxDispatch(setIsUploadModalVisible(!isUploadModalVisible))
              }
              className="bg-[#EAEAEA] text-[#303038] text-sm flex items-center gap-1 border-none p-1.5 rounded"
            >
              <PlusOutlined />
              Add File
            </button>
            {!isPublic && (
              <button
                onClick={() => setOpen(true)}
                className="bg-[#EAEAEA] text-[#303038] text-sm flex items-center gap-1 border-none p-1.5 rounded"
              >
                <PlusOutlined />
                Request Documents
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center flex-grow items-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {files.length > 0 ? (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-[#1F1E23] p-4 rounded-lg"
                  >
                    <div className="flex-1 flex gap-4 items-center text-center">
                      <h3 className="text-base font-semibold text-white">
                        {file.name}
                      </h3>
                      <p className="text-[#A2A2A2] text-sm">
                        {file.description &&
                          truncateDescription(file.description, 145)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEditClick(file.id)}
                        size="small"
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => showDeleteConfirm(file.id)}
                        danger
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center py-10">
                <Empty description="No Files Available" />
              </div>
            )}
          </>
        )}
      </div>
      <UpdateModal
        isVisible={isUpdateModal}
        onOk={handleUpdateOk}
        onCancel={handleUpdateCancel}
        state={state}
        dispatch={dispatch}
      />
    </div>
  );
};

export default FileUploadComponent;
