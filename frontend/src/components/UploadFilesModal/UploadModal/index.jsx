import React from "react";
import { Modal, Upload, Button, Select } from "antd";
import { DownloadOutlined } from "../../../constants/IconPack";
import { useModal } from "../ModalContext";

const { Dragger } = Upload;
const { Option } = Select;

const UploadModal = ({
  isVisible,
  onOk,
  onCancel,
  uploadProps,
  selectedFile,
  setTempDealId,
  tempDealId,
  deals,
  isFileUploadModule
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
          disabled={isFileUploadModule ? !selectedFile && !tempDealId : !selectedFile}
        >
          Continue
        </Button>,
      ]}
    >
      {isFileUploadModule && <>
        <Select className="w-full" placeholder="Select Deal" value={tempDealId} onChange={(value) => setTempDealId(value)}>
          {deals.map((data, index) => {
            return <Option value={data.id} key={index}>{data.name}</Option>
          })}
        </Select>
      </>}
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
