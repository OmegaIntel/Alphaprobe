import React from "react";
import { Modal, Form, Input, Button, notification, Select } from "antd";
import { useModal } from "../UploadFilesModal/ModalContext";
import "./styles.css";
import { addCollaboration } from "../../services/addCollaboration";

const AddCollaboration = ({ isOpen, onRequestClose }) => {
  const { deals } = useModal();

  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      const payload = {
        email: values.email,
        deal_id: values.project,
      };
      await addCollaboration(payload);
      notification.success({
        message: "Request Submitted",
        description: "Your request has been submitted successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Submission Failed",
        description:
          "There was an error submitting your request. Please try again.",
      });
    } finally {
      form.resetFields();
      onRequestClose();
    }
  };

  return (
    <>
      <Modal
        title="Request a Collaboration"
        open={isOpen}
        onCancel={() => {
          onRequestClose();
          form.resetFields();
        }}
        footer={null}
        centered
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          className="collabration"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please enter your email!" }]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item
            name="project"
            label="Project"
            rules={[{ required: true, message: "Please enter your project!" }]}
          >
            <Select
              options={deals.map((dealData) => ({
                value: dealData.id,
                label: dealData.name,
              }))}
              placeholder="Select a project"
              style={{
                backgroundColor: "white !important",
                color: "black !important",
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddCollaboration;
