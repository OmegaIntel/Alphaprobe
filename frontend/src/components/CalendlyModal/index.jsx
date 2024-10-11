import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Input, Select, message, Spin } from "antd";
import { CalenderIcon } from "../../constants/IconPack";
import {
  callbackCalendly,
  connectCalendly,
  fetchEventTypes,
} from "../../services/calendlyService";
import { sendEmail } from "../../services/emailService";

const { Option } = Select;

const CalendlyModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const [form] = Form.useForm();
  const openModal = async () => {
    try {
      if (!calendlyUrl) {
        const response = await connectCalendly();
        setCalendlyUrl(response.url);
      }
      setIsModalOpen(true);
    } catch (error) {
      message.error("Failed to initiate Calendly connection");
    }
  };
  const closeModal = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setIsLoading(true);
      callbackCalendly(code)
        .then((data) => {
          message.success(data.message);
          message.info("Events Data Start Fetching...");
          setIsConnected(true);
        })
        .then(async () => {
          const eventTypesData = await fetchEventTypes();
          setEventTypes(eventTypesData);
          setIsModalOpen(true);
        })
        .catch(() => {
          message.error("Failed to connect Calendly");
        })
        .finally(() => {
          window.history.replaceState(null, "", window.location.pathname);
          setIsLoading(false);
        });
    }
  }, []);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setIsEmailLoading(true);
        const email = values.email;
        const schedulingUrl = values.schedulingUrl;
        const userName = eventTypes.find(
          (event) => event.scheduling_url === schedulingUrl
        )?.profile?.name;
        const eventName = eventTypes.find(
          (event) => event.scheduling_url === schedulingUrl
        )?.name;

        const emailData = {
          email: email,
          title: "Schedule Your Appointment with " + userName,
          description: `Hello,\n\nI hope this message finds you well!\n\nI would like to invite you to schedule a meeting regarding ${eventName}. You can choose a time that works best for you using the link below:\n\nEvent Name: ${eventName}\nSchedule Your Appointment: ${schedulingUrl}\n\nThank you, and I look forward to our meeting!\n\nBest regards,\n${userName}`,
        };
        return emailData;
      })
      .then(async (emailData) => {
        try {
          const response = await sendEmail(emailData);
          if (response.message)
            message.success(response.message || "Email sent successfully!");
        } catch (error) {
          console.log(error);
          message.error(
            error.message || "There was an error sending the email."
          );
        }
      })
      .catch((err) => {
        message.error("Please fill in all required fields.");
      })
      .finally(() => {
        setIsEmailLoading(false);
        closeModal();
      });
  };

  return (
    <>
      <Button
        onClick={openModal}
        className="h-full p-2 rounded bg-[#303038] border border-[#46464F] hover:bg-[#0088CC] hover:border-[#0088CC] cursor-pointer "
      >
        <CalenderIcon />
      </Button>
      {isLoading && <Spin size="large" spinning={isLoading} fullscreen />}
      <Modal
        title={
          <div className="text-white text-base font-bold">
            Connect to Calendly
          </div>
        }
        open={isModalOpen}
        onCancel={closeModal}
        centered
        footer={
          isConnected ? (
            <Form.Item>
              <Button
                onClick={handleSubmit}
                className="!bg-[#303038] text-[#DCDCDC] disabled:text-[#46464F] border-none "
                loading={isEmailLoading}
              >
                Submit
              </Button>
            </Form.Item>
          ) : null
        }
        styles={{
          content: {
            background: "#1F1E23",
            color: "#FFFFFF",
            boxShadow: "0px 2px 10px 0px #000000CC",
          },
          header: { background: "#1F1E23", color: "#FFFFFF" },
        }}
      >
        {!isConnected ? (
          <div className="text-center text-sm mt-4 flex flex-col gap-4 justify-center items-center">
            <p>Click the button below to connect your Calendly account.</p>
            {calendlyUrl && (
              <a
                href={calendlyUrl}
                className="!bg-[#303038] text-[#DCDCDC] disabled:text-[#46464F] border-none w-fit p-2 rounded"
              >
                Connect Calendly
              </a>
            )}
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              label={<div className="text-[#C8C8C8] text-sm">Email</div>}
              name="email"
              rules={[{ required: true, message: "Please enter your email" }]}
            >
              <Input
                classNames={{
                  input:
                    "text-[#F6F6F6] bg-[#212126] border-2 border-[#46464F] hover:bg-[#212126] focus:bg-[#212126] focus:border-[#46464F] hover:border-[#46464F]",
                }}
              />
            </Form.Item>
            <Form.Item
              name="schedulingUrl"
              label={
                <div className="text-[#C8C8C8] text-sm">Select Event Type</div>
              }
              rules={[
                { required: true, message: "Please select an event type" },
              ]}
            >
              <Select placeholder="Select an event type">
                {eventTypes.map((event) => (
                  <Option
                    key={event.scheduling_url}
                    value={event.scheduling_url}
                  >
                    {event.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};

export default CalendlyModal;
