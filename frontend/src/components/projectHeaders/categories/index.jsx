import React, { useState, useEffect } from "react";
import DilligenceContainer from "../../dilligence_list/container";
import { categoryList, subCategoryList } from "../../../constants";
import FileUploadComponent from "../../FileUploadComponent";
import { MoreOutlined } from "@ant-design/icons";
import AddProgress from "../../progressModal";
import { Select } from "antd";
import ProjectDetails from "../../projectDetails";
import { getTasks } from "../../../services/taskService";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedCategory } from "../../../redux/dealsSlice";
import { ThesisForm } from "../../InvestmentThesis/ThesisForm";
import IndustryCheckboxes from "../../MarketResearch/MarketResearchCheckbox";
import CollapsibleSidebar from "../../Sidebar/CollapsibleSidebar";
import ThesisCardComponent from "../../InvestmentThesis/ThesisSummary/ThesisCardComponent";
import IndustryReport from "../../MarketResearch/IndustryReportSection/IndustryReport";
import ReportDropdown from "../../MarketResearch/IndustryReportSection/ReportDropdown";

const { Option } = Select;

const Categories = () => {
  const [activeCategory, setActiveCategory] = useState("Investment Thesis");
  const [selectedSubcategory, setSelectedSubcategory] =
    useState("Current Workspace");
  const [progress, setProgress] = useState();
  const [name, setName] = useState("");
  const [todoTask, setTodoTask] = useState();
  const [inprogress, setInprogress] = useState();
  const [done, setDone] = useState();

  const [toggle, setToggle] = useState(false);

  const { dealId, deals, todos } = useSelector((state) => state.deals);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setSelectedCategory(activeCategory));
  }, [activeCategory, dispatch]);

  useEffect(() => {
    if (dealId) {
      const dealData = deals.find((deal) => deal.id === dealId);
      setProgress(dealData?.progress);
      setName(dealData?.name);
      if (todos && todos.length > 0) {
        const groupedTasks = todos.reduce((acc, task) => {
          const status = task.status;
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(task);
          return acc;
        }, {});
        setTodoTask(groupedTasks["To Do"] || []);
        setInprogress(groupedTasks["In Progress"] || []);
        setDone(groupedTasks["Done"] || []);
      } else {
        getTasks(dealId)
          .then((data) => {
            const groupedTasks = data.reduce((acc, task) => {
              const status = task.status;
              if (!acc[status]) {
                acc[status] = [];
              }
              acc[status].push(task);
              return acc;
            }, {});
            setTodoTask(groupedTasks["To Do"] || []);
            setInprogress(groupedTasks["In Progress"] || []);
            setDone(groupedTasks["Done"] || []);
          })
          .catch((e) => {
            if (e.response.status === 404) {
              setTodoTask([]);
            } else {
              console.log(e);
            }
          });
      }
    }
  }, [dealId, toggle, todos, deals]);

  const questions = [
    {
      id: 1,
      question: "What industries or sectors are you most interested in ?",
      type: "text",
    },
    {
      id: 2,
      question:
        "Do you have expertise or experience in particular industries that you'd like to leverage?",
      type: "text",
    },
    {
      id: 3,
      question: "What industry characteristics are most import to you ?",
      type: "select",
      options: [
        "Growth Rate",
        "Fragmentation",
        "Recurring Revenue",
        "Profit Margins",
        "Other",
      ],
    },
    {
      id: 4,
      question: "Are there any specific mega-trend you want to capitalize on ?",
      type: "select",
      options: [
        "Aging Population",
        "Digital Transformation",
        "Health and Wellness",
        "Other",
      ],
    },
    {
      id: 5,
      question: "Are you more interested in industries with ?",
      type: "select",
      options: ["Rapid technological change", "Traditional business model"],
    },
    {
      id: 6,
      question:
        "Anyhting else we should consider in coming up with investment thesis ?",
      type: "text",
    },
  ];

  return (
    <>
      <div className="flex flex-row flex-grow overflow-auto ">
        <div className="w-[70%] flex flex-grow flex-col overflow-auto w-full">
          <div className="flex items-center flex-col largeDesktop:flex-row pt-5 px-5 ml-1 gap-4">
            <div className="flex laptop:gap-2 largeDesktop:gap-0">
              {categoryList.map((data, index) => (
                <div
                  className={`${
                    data === activeCategory && "bg-[#212126] rounded-lg"
                  } p-1 text-center desktop:p-2 cursor-pointer text-sm`}
                  key={index}
                  onClick={() => setActiveCategory(data)}
                >
                  {data}
                </div>
              ))}
            </div>
            {/* <div>
              {activeCategory !== "Action Items" &&
                activeCategory !== "Documents" && (
                  <Select
                    className="ml-2 largeDesktop:w-[170px] "
                    value={selectedSubcategory}
                    onChange={(value) => {
                      setSelectedSubcategory(value);
                    }}
                  >
                    {subCategoryList.map((subcategory) => (
                      <Option key={subcategory} value={subcategory}>
                        {subcategory}
                      </Option>
                    ))}
                  </Select>
                )}
            </div> */}
          </div>
          {}

          {activeCategory === "Action Items" ? (
            <DilligenceContainer />
          ) : activeCategory === "Documents" ? (
            <FileUploadComponent />
          ) : activeCategory === "Investment Thesis" ? (
            <>
              <div className="flex-grow overflow-y-auto bg-[#151518] ml-1 scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800">
                <div className="mt-10 p-3">
                  <ThesisForm questions={questions} />
                  <ThesisCardComponent />
                </div>
              </div>
              <div className="flex-grow overflow-y-auto bg-[#151518] ml-1 scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800">
                <div className="mt-10 p-3"></div>
              </div>
            </>
          ) : activeCategory === "Market Research" ? (
            <>
              <div className="flex-grow overflow-y-auto bg-[#151518] ml-1 scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800">
                <div className="p-3">
                  <IndustryReport />
                </div>
              </div>
            </>
          ) : (
            <ProjectDetails
              isActiveCategory={activeCategory}
              isActiveSubCategory={selectedSubcategory}
            />
          )}
        </div>
        <div>
          <CollapsibleSidebar />
        </div>
        {/* <div className="w-[30%] flex flex-col">
          <div className="bg-black p-2 flex flex-row justify-between border-b border-gray-800">
            <div>{progress}% complete</div>
            <AddProgress
              progress={progress}
              setToggle={setToggle}
              setProgress={setProgress}
              name={name}
            />
          </div>
          <div className="p-2 flex flex-row justify-between bg-black">
            <MoreOutlined className=" cursor-pointer" />
           
          </div>
          <div className="overflow-auto bg-black text-white space-y-4 p-4 flex flex-grow flex-col">
            {todoTask && todoTask.length > 0 && (
              <div>
                <div className="font-semibold text-lg mb-2 border-b border-gray-600 pb-1">
                  To Do
                </div>
                {todoTask?.map((data, index) => (
                  <div key={index} className="bg-[#212126] rounded-lg p-2 mb-2">
                    {data?.task}
                  </div>
                ))}
              </div>
            )}
            {inprogress && inprogress.length > 0 && (
              <div>
                <div className="font-semibold text-lg mb-2 border-b border-gray-600 pb-1">
                  In Progress
                </div>
                {inprogress?.map((data, index) => (
                  <div key={index} className="bg-[#212126] rounded-lg p-2 mb-2">
                    {data?.task}
                  </div>
                ))}
              </div>
            )}
            {done && done.length > 0 && (
              <div>
                <div className="font-semibold text-lg mb-2 border-b border-gray-600 pb-1">
                  Done
                </div>
                {done?.map((data, index) => (
                  <div key={index} className="bg-[#212126] rounded-lg p-2 mb-2">
                    {data?.task}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div> */}
      </div>
    </>
  );
};

export default Categories;
