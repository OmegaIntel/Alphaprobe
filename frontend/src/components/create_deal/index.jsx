import React, { useState, useRef, useEffect } from "react";
import DealDocumentsCard from "../card";
import { useMediaQuery } from "react-responsive";
import { createDeal } from "../../services/dealService";
import { notification } from "antd";
import { useNavigate } from "react-router-dom";
import { useModal } from "../UploadFilesModal/ModalContext";
import DiligenceDocumentsModal from "../requestDocuments";

const CreateDeal = () => {
  const [projectName, setProjectName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [investmentThesis, setInvestmentThesis] = useState("");
  const [industry, setIndustry] = useState("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const { setIsUploadModalVisible, setDealId } = useModal();
  const [requestModal, setRequestModal] = useState(false);
  const navigation = useNavigate();

  const containerRef = useRef(null);

  const isSmallScreen = useMediaQuery({ query: "(max-width: 1440px)" });

  const cardsData = [
    {
      title: "Request Deal Documents",
      description: "Request Diligence documents to from Management",
      type: "1",
    },
    {
      title: "Diligence Planning",
      description: "Stay organized and plan different phases of your deal",
      type: "2",
    },
    {
      title: "Meet with Management",
      description:
        "Setup a Kickoff call with Management. Send a meeting invite using templates",
      type: "3",
    },
  ];

  useEffect(() => {
    if (containerRef) {
      const container = containerRef.current;
      if (container) {
        const isContentOverflowing =
          container.scrollHeight - 53 > container.clientHeight;
        setIsOverflowing(isContentOverflowing);
      }
    }
  }, [containerRef]);

  const handleClick = async () => {
    if (
      !projectName ||
      !projectDescription ||
      !investmentThesis ||
      !industry ||
      !dueDate
    ) {
      notification.error({
        message: "Missing Required Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }

    const dealData = {
      name: projectName,
      overview: projectDescription,
      investment_thesis: investmentThesis,
      industry: industry,
      due_date: new Date(dueDate).toISOString(), // Convert to ISO format
      start_date: new Date().toISOString(), // Current date in ISO format
      progress: "0",
    };

    try {
      const response = await createDeal(dealData);
      notification.success({
        message: "Deal Created",
        description: "Your deal is created successfully.",
      });
      if (response) {
        setDealId(response.id);
        setIsUploadModalVisible(true);
      }
    } catch (error) {
      notification.error({
        message: "Something went wrong!",
        description:
          "There was an error submitting your deal request. Please try again.",
      });
    }
  };

  const onRequestClose = () => {
    setRequestModal(false);
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col space-y-1 overflow-y-auto min-h-screen"
    >
      <DiligenceDocumentsModal isOpen={requestModal} onRequestClose={onRequestClose}/>
      <div
        className={`ml-1 flex text-white p-5 bg-[#151518] ${
          isOverflowing ? "min-h-fit" : "flex-1"
        } ${isSmallScreen ? "flex-col" : "flex-row"}`}
      >
        <div
          className={`bg-[#24242A] p-8 rounded-lg h-fit m-auto ${
            isSmallScreen ? "" : "w-[75%]"
          }`}
        >
          <div className="flex space-x-4 mb-6">
            <div className="w-2/3 flex flex-row items-center">
              <label className="block text-base mr-5">Name</label>
              <input
                type="text"
                className="bg-[#212126] p-2 w-[65%] rounded-md border border-[#46464F]"
                value={projectName}
                placeholder="Project Name..."
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="w-1/3 flex flex-row items-center">
              <label className="block text-base mr-5">Due Date</label>
              <input
                type="date"
                className="p-2 bg-[#212126] w-[60%] rounded-md border border-[#46464F] date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <hr className="h-px my-4 bg-gray-200 border-0 dark:bg-[#36363F]"></hr>

          <div className="mb-6 mt-10">
            <label className="block mb-2">Overview</label>
            <textarea
              className="w-full p-3 bg-[#212126] rounded-md border border-[#46464F] h-28"
              placeholder="Project Description..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2">Investment Thesis</label>
            <textarea
              className="w-full p-3 bg-[#212126] rounded-md border border-[#46464F] h-28"
              placeholder="Short description of your investment thesis..."
              value={investmentThesis}
              onChange={(e) => setInvestmentThesis(e.target.value)}
            />
          </div>

          <div className="flex space-x-4 mt-11 mb-6">
            <div className="w-3/5 flex flex-row items-center">
              <label className="block mr-5">Industry</label>
              <select
                className="p-2 bg-[#212126] pr-8 rounded-md border border-[#46464F] w-[60%]"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="" disabled>
                  Select industry
                </option>
                <option value="tech">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
              </select>
            </div>
            <div className="w-2/5 flex justify-end">
              <button
                className="bg-white text-black p-1 rounded-md w-52 hover:bg-gray-200"
                onClick={handleClick}
              >
                <div className="text-center w-full">Create New Deal</div>
              </button>
            </div>
          </div>
        </div>
        <div
          className={`rounded-lg flex ${
            isSmallScreen
              ? "flex-row space-x-4"
              : "flex-col space-y-4 ml-2 w-[25%]"
          } m-auto`}
        >
          {cardsData.map((data, index) => {
            return (
              <DealDocumentsCard
                title={data.title}
                description={data.description}
                type={data.type}
                key={index}
                setRequestModal={setRequestModal}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreateDeal;
