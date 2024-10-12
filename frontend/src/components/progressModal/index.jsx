import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, notification } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { updateDeal } from "../../services/dealService";
import { useModal } from "../UploadFilesModal/ModalContext";

const AddProgress = ({ progress, setToggle, name }) => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [submittable, setSubmittable] = useState(false);

  const { dealId } = useModal();

  const handleOpen = () => setVisible(true);
  const handleClose = () => {
    form.resetFields(); // Reset fields when closing
    setVisible(false);
  };

  useEffect(() => {
    form.setFieldsValue({ progress: parseInt(progress) || 0 });
  }, [form, progress]);

  const onFinish = async (values) => {
    const dealData = {
      name: name,
      progress: values.progress.toString(),
    };
    updateDeal(dealData, dealId)
      .then(() => {
        setToggle((prev) => !prev);
        notification.success({ message: "Progress Updated!" });
      })
      .catch(() => {
        notification.error({ message: "Error in updaing progress!" });
      })
      .finally(() => {
        handleClose(); // Close the modal after submission
      });
  };

  const validateProgress = (_, value) => {
    if (!value || (value >= 0 && value <= 100)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("Progress must be between 0 and 100!"));
  };

  // Watch form changes to enable/disable the submit button
  const values = Form.useWatch([], form);
  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false));
  }, [form, values]);

  return (
    <>
      <button onClick={handleOpen} className="cursor-pointer">
        <MoreOutlined />
      </button>
      <Modal
        title={
          <div className="text-white text-base font-bold">Update Progress</div>
        }
        open={visible}
        onCancel={handleClose}
        footer={null}
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
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ progress: parseInt(progress) || 0 }}
        >
          <Form.Item
            name="progress"
            label={<span style={{ color: "white" }}>Progress %</span>}
            rules={[
              { required: true, message: "Please enter progress!" },
              { validator: validateProgress },
            ]}
          >
            <Input
              style={{
                backgroundColor: "#212126",
                color: "#fff",
                border: "10px solid !important",
                borderColor: "#46464f",
                padding: "8px",
              }}
              type="number"
              min={0}
              max={100}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" disabled={!submittable}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddProgress;
