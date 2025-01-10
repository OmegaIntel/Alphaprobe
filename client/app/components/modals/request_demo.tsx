import React, { useState } from "react";
import { Modal, Form, Input, Button, notification } from "antd";
import { requestDemo } from "~/services/demoService";

interface RequestFormValues {
  name: string;
  email: string;
  company: string;
  message: string;
}

const RequestDemo: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);

  const handleOpen = (): void => setVisible(true);
  const handleClose = (): void => setVisible(false);

  const onFinish = async (values: RequestFormValues): Promise<void> => {
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
        title={
          <div className="text-white text-base font-bold">Request a Demo</div>
        }
        open={visible}
        onCancel={handleClose}
        footer={null}
        centered
        // Note: Ant Design Modal uses `style` for overall styling. 
        // Customizing header/content specifically might require additional CSS or overriding component styles.
        style={{
          background: "#1F1E23",
          color: "white",
          boxShadow: "0px 2px 10px 0px #000000CC",
        }}
      >
        <Form<RequestFormValues>
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
            label={<span style={{ color: "white" }}>Name</span>}
            rules={[{ required: true, message: "Please enter your name!" }]}
          >
            <Input
              style={{
                backgroundColor: "#212126",
                color: "#fff",
                border: "10px solid #46464f",
                padding: "8px",
              }}
            />
          </Form.Item>
          <Form.Item
            name="email"
            label={<span style={{ color: "white" }}>Email</span>}
            rules={[{ required: true, message: "Please enter your email!" }]}
          >
            <Input
              style={{
                backgroundColor: "#212126",
                color: "#fff",
                border: "10px solid #46464f",
                padding: "8px",
              }}
            />
          </Form.Item>
          <Form.Item
            name="company"
            label={<span style={{ color: "white" }}>Company</span>}
            rules={[{ required: true, message: "Please enter your company!" }]}
          >
            <Input
              style={{
                backgroundColor: "#212126",
                color: "#fff",
                border: "10px solid #46464f",
                padding: "8px",
              }}
            />
          </Form.Item>
          <Form.Item
            name="message"
            label={<span style={{ color: "white" }}>Message</span>}
            rules={[{ required: true, message: "Please enter your message!" }]}
          >
            <Input.TextArea
              rows={4}
              style={{
                backgroundColor: "#212126",
                color: "#fff",
                border: "10px solid #46464f",
                padding: "8px",
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

export default RequestDemo;
