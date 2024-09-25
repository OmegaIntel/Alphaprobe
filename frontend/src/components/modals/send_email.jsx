import React, { useState } from "react";
import { Modal, Form, Input, Button, notification, Spin } from "antd";
import { sendEmail } from "../../services/emailService";
import { EmailIcon } from "../../constants/IconPack";
import { LoadingOutlined } from "@ant-design/icons";

const SendEmailModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const handleOpenModal = () => setIsModalVisible(true);
  const handleCloseModal = () => {
    form.resetFields();
    setIsLoading(false);
    setIsModalVisible(false);
  };

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const res = await sendEmail(formData);
      if (res.message) {
        notification.success({
          message: res.message,
          description: `Your email to ${formData.email} has been sent successfully.`,
        });
        handleCloseModal();
      }
    } catch (error) {
      notification.error({
        message: "Email Sending Failed",
        description: "There was an issue sending your email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="p-3 rounded bg-[#303038] border border-[#46464F] hover:bg-[#0088CC] hover:border-[#0088CC] cursor-pointer"
      >
        <EmailIcon />
      </button>

      <Modal
        title="Send an Email"
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        centered
      >
        <Form
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            description:
              "Hi there, I wanted to follow up on our previous conversation.",
          }}
        >
          <Form.Item
            name="email"
            label="Recipient's Email"
            rules={[
              {
                required: true,
                message: "Please enter the recipient's email.",
                type: "email",
              },
            ]}
          >
            <Input placeholder="Enter recipient's email address" />
          </Form.Item>
          <Form.Item
            name="title"
            label="Subject"
            rules={[{ required: true, message: "Please enter the subject." }]}
          >
            <Input placeholder="Enter the email subject" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Message"
            rules={[{ required: true, message: "Please enter your message." }]}
          >
            <Input.TextArea rows={4} placeholder="Enter your message" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block disabled={isLoading}>
              {isLoading ? (
                <Spin indicator={<LoadingOutlined spin />} />
              ) : (
                "Send Email"
              )}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SendEmailModal;
