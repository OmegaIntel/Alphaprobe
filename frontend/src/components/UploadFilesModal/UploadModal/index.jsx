import React from "react";
import { Modal, Upload, Button } from "antd";
import { DownloadOutlined } from "../../../constants/IconPack";

const { Dragger } = Upload;

const UploadModal = ({
  isVisible,
  onOk,
  onCancel,
  uploadProps,
  selectedFile,
}) => {
  return (
    <Modal
      title={
        <div className="text-white text-base font-bold">Upload File(s)</div>
      }
      open={isVisible}
      onOk={onOk}
      centered
      onCancel={onCancel}
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
          onClick={onCancel}
        >
          Cancel
        </Button>,
        <Button
          key="continue"
          type="primary"
          className="!bg-[#303038] text-[#DCDCDC] disabled:text-[#46464F] border-none "
          onClick={onOk}
          disabled={!selectedFile}
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
  );
};

export default UploadModal;
