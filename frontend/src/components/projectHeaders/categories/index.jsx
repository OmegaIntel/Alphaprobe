import React, { useState, useEffect } from "react";
import DilligenceContainer from "../../dilligence_list/container";
import { categoryList, subCategoryList } from "../../../constants";
import FileUploadComponent from "../../FileUploadComponent";
import { MoreOutlined } from "@ant-design/icons";
import AddProgress from "../../progressModal";
import { useModal } from "../../UploadFilesModal/ModalContext";
import { getDeals } from "../../../services/dealService";
import { notification, Select } from "antd";
import ProjectDetails from "../../projectDetails";
import { getTasks } from "../../../services/taskService";

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

  const {
    dealId,
    todo,
    setIsUploadModalVisible,
    isUpdateModalVisible,
    setSelectedCategory,
  } = useModal();

  useEffect(() => {
    setSelectedCategory(activeCategory);
  }, [activeCategory, setSelectedCategory]);

  useEffect(() => {
    if (dealId) {
      getDeals()
        .then((data) => {
          const dealData = data.find((deal) => deal.id === dealId);
          setProgress(dealData?.progress);
          setName(dealData?.name);
        })
        .catch(() =>
          notification.error({
            message: "Something went wrong in fetching progress!",
          })
        );
      if (todo && todo.length > 0) {
        const groupedTasks = todo.reduce((acc, task) => {
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
          .then((data) => setTodoTask(data || []))
          .catch((e) => {
            if (e.response.status === 404) {
              setTodoTask([]);
            } else {
              console.log(e);
            }
          });
      }
    }
  }, [dealId, toggle, todo]);

  return (
    <>
      <div className="flex flex-row flex-grow overflow-auto">
        <div className="w-[70%] flex flex-grow flex-col overflow-auto">
          <div className="flex items-center bg-[#151518] pt-5 px-5 ml-1">
            {categoryList.map((data, index) => (
              <div
                className={`${
                  data === activeCategory && "bg-[#212126] rounded-lg"
                } p-2 cursor-pointer text-sm`}
                key={index}
                onClick={() => setActiveCategory(data)}
              >
                {data}
              </div>
            ))}
            {activeCategory !== "Action Items" &&
              activeCategory !== "Documents" && (
                <Select
                  className="ml-2 w-[170px]"
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
          </div>

          {activeCategory === "Action Items" ? (
            <DilligenceContainer />
          ) : activeCategory === "Documents" ? (
            <FileUploadComponent
              dealId={dealId}
              isUploadModalVisible={isUpdateModalVisible}
              setIsUploadModalVisible={setIsUploadModalVisible}
              isUpdateModalVisible={isUpdateModalVisible}
              setSelectedCategory={setSelectedCategory}
            />
          ) : (
            <ProjectDetails
              isActiveCategory={activeCategory}
              isActiveSubCategory={selectedSubcategory}
            />
          )}
        </div>
        <div className="w-[30%] flex flex-col">
          <div className="bg-black p-2 flex flex-row justify-between border-b border-gray-800">
            <div>{progress}% complete</div>
            <AddProgress
              progress={progress}
              setToggle={setToggle}
              name={name}
            />
          </div>
          <div className="p-2 flex flex-row justify-between bg-black">
            <div>Action Items</div>
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
        </div>
      </div>
    </>
  );
};

export default Categories;
