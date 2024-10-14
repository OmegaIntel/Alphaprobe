import React, { useState } from "react";
import Modal from "react-modal";
import "./DiligenceDocuments.css";
import {
  CloseOutlined,
  DownloadOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { notification, Spin } from "antd";
import { uploadFiles } from "../../services/uploadService";
import { sendLinkEmail } from "../../services/magicLink";

Modal.setAppElement("#root");

const DiligenceDocumentsModal = ({ dealId, isOpen, onRequestClose }) => {
  const [activeSection, setActiveSection] = useState("File");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({
    File: [],
    "Corporate & Legal": [],
    "Financial & Tax": [],
    "Operations & Technology": [],
    "HR & Employee": [],
    "Sales & Marketing": [],
  });
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    const validFiles = selectedFiles.filter(
      (file) => file.size <= 25 * 1024 * 1024
    ); // 25MB limit
    const invalidFiles = selectedFiles.filter(
      (file) => file.size > 25 * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      notification.error({
        message:
          "Some files are too large or not PDF. Only PDFs under 25MB are allowed.",
      });
    } else {
      setError(null); // Clear error if all files are valid
    }

    if (validFiles.length > 0) {
      setLoading(true);
      try {
        // Upload all files concurrently
        await Promise.all(
          validFiles.map(async (file) => {
            const formData = new FormData();
            formData.append("files", file);
            formData.append("deal_id", dealId);
            formData.append("name", file.name);
            formData.append("description", null);
            formData.append("category", null);
            formData.append("sub_category", null);
            formData.append("tags", null);
            await uploadFiles(formData);
          })
        );
        setFiles((prevFiles) => ({
          ...prevFiles,
          [activeSection]: [...prevFiles[activeSection], ...validFiles],
        }));
        notification.success({ message: "All files uploaded successfully!" });
      } catch (error) {
        notification.error({ message: error.response.data.detail });
      } finally {
        setLoading(false); // Set loading to false after all uploads
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const validFiles = droppedFiles.filter(
      (file) => file.size <= 25 * 1024 * 1024
    ); // 25MB limit
    const invalidFiles = droppedFiles.filter(
      (file) => file.size > 25 * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      notification.error({
        message:
          "Some files are too large or not PDF. Only PDFs under 25MB are allowed.",
      });
    } else {
      setError(null); // Clear error if all files are valid
    }

    if (validFiles.length > 0) {
      setLoading(true);
      try {
        // Upload all files concurrently
        await Promise.all(
          validFiles.map(async (file) => {
            const formData = new FormData();
            formData.append("files", file);
            formData.append("deal_id", dealId);
            formData.append("name", file.name);
            formData.append("description", null);
            formData.append("category", null);
            formData.append("sub_category", null);
            formData.append("tags", null);
            await uploadFiles(formData);
          })
        );
        setFiles((prevFiles) => ({
          ...prevFiles,
          [activeSection]: [...prevFiles[activeSection], ...validFiles],
        }));
        notification.success({ message: "All files uploaded successfully!" });
      } catch (error) {
        notification.error({ message: error.response.data.detail });
      } finally {
        setLoading(false); // Set loading to false after all uploads
      }
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSubmit = () => {
    if (!email) {
      setError("Please enter a valid email.");
      return;
    }

    const payload = {
      email: email,
      deal_id: dealId,
    };
    setLoading(true);
    sendLinkEmail(payload)
      .then(() => notification.success({ message: "Sent the link!" }))
      .catch(() => notification.error({ message: "Something went wrong!" }))
      .finally(() => setLoading(false));
  };

  const renderSectionContent = () => {
    return (
      <div>
        <div className="text-base font-bold">
          Upload Deal documents or send a request to Management
        </div>
        {files[activeSection].length === 0 ? (
          <div
            className="file-dropzone mt-5 flex flex-col p-5"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <DownloadOutlined />
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              style={{ display: "none" }}
              id="fileInput"
            />
            <label htmlFor="fileInput" className="file-drop-label">
              <div className="my-2">Drag and Drop file(s) here</div>
              <div className="my-2">or</div>
              <div className="bg-[#303038] p-2 rounded my-2 font-bold">
                Browse for file(s)
              </div>
            </label>
            <div className="text-base font-extralight mb-1">
              File size limit: 25MB
            </div>
          </div>
        ) : (
          <div className="file-list overflow-auto">
            <ul>
              {files[activeSection].map((file, index) => (
                <li
                  key={index}
                  className="flex flex-row justify-between p-1 px-2 bg-[#303038] rounded mb-3"
                >
                  <div className="flex flex-row">
                    <div className="mr-2">{index + 1}.</div>
                    <div>{file.name}</div>
                  </div>
                  <PaperClipOutlined />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        onRequestClose();
        setFiles({
          File: [],
          "Corporate & Legal": [],
          "Financial & Tax": [],
          "Operations & Technology": [],
          "HR & Employee": [],
          "Sales & Marketing": [],
        });
      }}
      className="diligence-modal"
      overlayClassName="diligence-modal-overlay"
    >
      {loading ? (
        <div className="flex items-center justify-center h-full w-full">
          <Spin />
        </div>
      ) : (
        <>
          <div className="flex flex-row justify-between pb-2 mb-2">
            <div className="text-xl font-bold">Diligence Documents</div>
            <CloseOutlined
              className="cursor-pointer"
              onClick={() => {
                onRequestClose();
                setFiles({
                  File: [],
                  "Corporate & Legal": [],
                  "Financial & Tax": [],
                  "Operations & Technology": [],
                  "HR & Employee": [],
                  "Sales & Marketing": [],
                });
              }}
            />
          </div>
          <div className="diligence-documents flex-grow flex flex-row h-full">
            <div className="side-navigation">
              <ul>
                <li
                  className={activeSection === "File" ? "active" : ""}
                  onClick={() => setActiveSection("File")}
                >
                  File
                </li>
                <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                <li
                  className={
                    activeSection === "Corporate & Legal" ? "active" : ""
                  }
                  onClick={() => setActiveSection("Corporate & Legal")}
                >
                  Corporate & Legal
                </li>
                <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                <li
                  className={
                    activeSection === "Financial & Tax" ? "active" : ""
                  }
                  onClick={() => setActiveSection("Financial & Tax")}
                >
                  Financial & Tax
                </li>
                <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                <li
                  className={
                    activeSection === "Operations & Technology" ? "active" : ""
                  }
                  onClick={() => setActiveSection("Operations & Technology")}
                >
                  Operations & Technology
                </li>
                <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                <li
                  className={activeSection === "HR & Employee" ? "active" : ""}
                  onClick={() => setActiveSection("HR & Employee")}
                >
                  HR & Employee
                </li>
                <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                <li
                  className={
                    activeSection === "Sales & Marketing" ? "active" : ""
                  }
                  onClick={() => setActiveSection("Sales & Marketing")}
                >
                  Sales & Marketing
                </li>
                <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
              </ul>
            </div>

            <div className="content-section p-3 w-[73%] h-[92%] rounded">
              {renderSectionContent()}
              <div className="request-section">
                <div className="font-bold">
                  Send a Consolidate Request List to Management
                </div>
                <div className=" my-2 flex flex-row justify-between mt-8">
                  <div className="flex flex-row items-center">
                    <div className="mr-2">Email Address</div>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      className="email-input px-4 py-2 border border-[#46464f]"
                    />
                    {error && <p className="error-text">{error}</p>}
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="bg-[#eaeaea] text-black px-4 py-2 rounded"
                  >
                    Send Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default DiligenceDocumentsModal;
