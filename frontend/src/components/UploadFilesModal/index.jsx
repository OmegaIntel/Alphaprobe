import React, { useState } from "react";
import { Modal, Upload, Button, Form, Input, Select, Tag } from "antd";
import { useModal } from "./ModalContext.js";
import { DownloadOutlined } from "../../constants/IconPack.js";

const { Dragger } = Upload;
const { Option } = Select;

const UploadFilesModal = () => {
  const {
    isUploadModalVisible,
    setIsUploadModalVisible,
    isUpdateModalVisible,
    setIsUpdateModalVisible,
  } = useModal();
  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tags, setTags] = useState([]); // Manage tags here
  const [newTag, setNewTag] = useState(""); // Current input for a new tag

  const handleUploadOk = () => {
    setIsUploadModalVisible(false);
    if (fileList.length > 0) {
      setIsUpdateModalVisible(true);
      setSelectedFile(fileList[0]);
    }
  };

  const handleUpdateOk = () => {
    setIsUpdateModalVisible(false);
    // Add logic to save file details (name/category)
  };

  const handleUploadCancel = () => {
    setIsUploadModalVisible(false);
  };

  const handleUpdateCancel = () => {
    setIsUpdateModalVisible(false);
  };

  const uploadProps = {
    fileList,
    onChange: (info) => {
      setFileList(info.fileList);
    },
    multiple: true,
  };
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setNewTag(""); // Reset input field after adding tag
  };

  const handleRemoveTag = (removedTag) => {
    setTags(tags.filter((tag) => tag !== removedTag));
  };
  return (
    <>
      {/* First Modal: File Upload */}
      <Modal
        title={
          <div className="text-white text-base font-bold">Upload File(s)</div>
        }
        open={isUploadModalVisible}
        onOk={handleUploadOk}
        centered
        onCancel={handleUploadCancel}
        styles={{
          content: {
            background: "#1F1E23",
            color: "#FFFFFF",
            boxShadow: "0px 2px 10px 0px #000000CC",
          },
          header: { background: "#1F1E23", color: "#FFFFFF" },
        }}
        footer={[
          <Button
            key="cancel"
            className="bg-[#303038] text-[#DCDCDC] border-none"
            onClick={handleUploadCancel}
          >
            Cancel
          </Button>,
          <Button
            key="continue"
            type="primary"
            className="!bg-[#303038] text-[#DCDCDC] disabled:text-[#46464F] border-none "
            onClick={handleUploadOk}
            disabled={fileList.length === 0}
          >
            Continue
          </Button>,
        ]}
      >
        <Dragger
          {...uploadProps}
          style={{
            padding: "20px",
            textAlign: "center",
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
            border: "2px dashed #505059",
            backgroundColor: "#303038",
          }}
        >
          <p className="text-[#6D6E74] w-full flex justify-center mb-4">
            <DownloadOutlined />
          </p>
          <p className="ant-upload-text !text-[#6D6E74]">Drag file(s) here</p>
          <p className="ant-upload-hint !text-[#6D6E74]">
            Or click to select file(s)
          </p>
        </Dragger>
      </Modal>

      {/* Second Modal: Update File Metadata */}
      {selectedFile && (
        <Modal
          title={
            <div className="text-white text-base font-bold">Upload File(s)</div>
          }
          open={isUpdateModalVisible}
          onOk={handleUpdateOk}
          centered
          onCancel={handleUpdateCancel}
          styles={{
            content: {
              background: "#1F1E23",
              color: "#FFFFFF",
              boxShadow: "0px 2px 10px 0px #000000CC",
            },
            header: { background: "#1F1E23", color: "#FFFFFF" },
          }}
          footer={[
            <Button key="cancel" onClick={handleUpdateCancel}>
              Cancel
            </Button>,
            <Button key="save" type="primary" onClick={handleUpdateOk}>
              Save
            </Button>,
          ]}
        >
          <Form layout="inline">
            {/* File Name */}
            <Form.Item
              label={<div className="text-[#C8C8C8] text-xs">Name</div>}
              name="name"
              initialValue={selectedFile.name}
            >
              <Input placeholder="Enter file name" />
            </Form.Item>

            {/* Category */}
            <Form.Item label="Category" name="category">
              <Select placeholder="Select category">
                <Option value="document">Document</Option>
                <Option value="image">Image</Option>
                <Option value="video">Video</Option>
              </Select>
            </Form.Item>

            {/* Sub-category */}
            <Form.Item label="Sub-category" name="subCategory">
              <Select placeholder="Select sub-category">
                <Option value="technical">Technical</Option>
                <Option value="financial">Financial</Option>
                <Option value="marketing">Marketing</Option>
              </Select>
            </Form.Item>

            {/* Tags */}
            <Form.Item label="Tags">
              <div style={{ display: "flex", alignItems: "center" }}>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter a tag and press +"
                />
                <Button onClick={handleAddTag} style={{ marginLeft: "10px" }}>
                  +
                </Button>
              </div>
              <div style={{ marginTop: "10px" }}>
                {tags.map((tag) => (
                  <Tag
                    closable
                    key={tag}
                    onClose={() => handleRemoveTag(tag)}
                    style={{ marginBottom: "5px" }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </Form.Item>

            {/* Description */}
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={4} placeholder="Enter file description" />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default UploadFilesModal;
