import React, { useState } from "react";
import { Modal, Form, Input, Button, notification } from "antd";
import { requestDemo } from "../../services/demoService";

const RequestDemo = () => {
  const [visible, setVisible] = useState(false);

  const handleOpen = () => setVisible(true);
  const handleClose = () => setVisible(false);

  const onFinish = async (values) => {
    try {
      await requestDemo(values);
      notification.success({
        message: "Request Submitted",
        description: "Your demo request has been submitted successfully.",
      });
      handleClose();
    } catch (error) {
      notification.error({
        message: "Submission Failed",
        description:
          "There was an error submitting your demo request. Please try again.",
      });
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="h-[45px] text-xs bg-[#eaeaea] p-4 rounded-md text-black text-center"
      >
        Request a Demo
      </button>
      <Modal
        title="Request a Demo"
        open={visible}
        onCancel={handleClose}
        footer={null}
        centered
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            name: "John Doe",
            email: "john.doe@example.com",
            company: "Example Inc.",
            message: "I'd like to request a demo of your application.",
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter your name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please enter your email!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="company"
            label="Company"
            rules={[{ required: true, message: "Please enter your company!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: "Please enter your message!" }]}
          >
            <Input.TextArea rows={4} />
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

export default RequestDemo;
