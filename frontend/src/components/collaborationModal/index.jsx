import React from "react";
import { Modal, Form, Input, Button, notification, Select } from "antd";
import { addCollaboration } from "../../services/addCollaboration";
import { useSelector } from "react-redux";

const AddCollaboration = ({ isOpen, onRequestClose }) => {
  const { deals } = useSelector((state) => state.deals);

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
      console.log(error)
      notification.error({
        message: "Submission Failed",
        description:
          error.response.data.detail
      });
    } finally {
      form.resetFields();
      onRequestClose();
    }
  };

  return (
    <>
      <Modal
        title={
          <div className="text-white text-base font-bold">
            Request a Collaboration
          </div>
        }
        open={isOpen}
        onCancel={() => {
          onRequestClose();
          form.resetFields();
        }}
        footer={null}
        centered
        styles={{
          content: {
            background: "#1F1E23",
            color: "white",
            boxShadow: "0px 2px 10px 0px #000000CC",
          },
          header: { background: "#1F1E23", color: "#FFFFFF" },
        }}
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          className="collabration"
        >
          <Form.Item
            name="email"
            label={<span style={{ color: "white" }}>Email</span>}
            rules={[{ required: true, message: "Please enter your email!" }]}
          >
            <Input
              style={{
                backgroundColor: "#212126",
                color: "#fff",
                border: "10px solid !important",
                borderColor: "#46464f",
              }}
              type="email"
            />
          </Form.Item>
          <Form.Item
            name="project"
            label={<span style={{ color: "white" }}>Project</span>}
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
                border: "none",
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
