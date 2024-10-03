import React, { useState, useEffect } from "react";
import DilligenceContainer from "../../dilligence_list/container";
import Subcategories from "../subcategories";
import { categoryList } from "../../../constants";
import { partialCategoryList } from "../../../constants";
import FileUploadComponent from "../../FileUploadComponent";
import { MoreOutlined } from "@ant-design/icons";
import AddProgress from "../../progressModal";
import { useModal } from "../../UploadFilesModal/ModalContext";
import { getDeals } from "../../../services/dealService";
import { notification } from "antd";

const Categories = () => {
  const [isActive, setIsActive] = useState("Investment Thesis");

  const [progress, setProgress] = useState();
  const [name, setName] = useState("");

  const [toggle, setToggle] = useState(false);
  const [role, setRole] = useState();

  const { dealId, setSelectedCategory, deals } = useModal();

  useEffect(() => {
    setSelectedCategory(isActive);
  }, [isActive, setSelectedCategory]);

  useEffect(() => {
    if (dealId) {
      getDeals()
        .then((data) => {
          const dealData = data.find((deal) => deal.id === dealId);
          setProgress(dealData?.progress);
          setName(dealData?.name);
          setRole(dealData?.role);
          if(dealData?.role==="DOCUMENT_COLLABORATOR"){
            setIsActive("Documents");
          }
        })
        .catch(() =>
          notification.error({
            message: "Something went wrong in fetching progress!",
          })
        );
    }
  }, [dealId, toggle]);

  return (
    <>
      <div className="flex flex-row flex-grow overflow-auto">
        <div className="w-[70%] flex flex-grow flex-col overflow-auto">
          <div className="flex flex-row bg-[#151518] pt-5 px-5 ml-1">
            {(role==="DOCUMENT_COLLABORATOR"?partialCategoryList:categoryList).map((data, index) => (
              <div
                className={`${
                  data === isActive && "bg-[#212126] rounded-lg"
                } p-3 cursor-pointer`}
                key={index}
                onClick={() => setIsActive(data)}
              >
                {data}
              </div>
            ))}
          </div>
          {isActive === "Action Items" ? (
            <DilligenceContainer />
          ) : isActive === "Documents" ? (
            <FileUploadComponent />
          ) : (
            <Subcategories isActiveCategory={isActive} />
          )}
        </div>
        <div className="w-[30%]">
          <div className="bg-black p-2 flex flex-row justify-between">
            <div>{progress}% complete</div>
            <AddProgress
              progress={progress}
              setToggle={setToggle}
              name={name}
            />
          </div>
          <div className="p-2 flex flex-row justify-between bg-[#151518]">
            <div>Action Items</div>
            <MoreOutlined className=" cursor-pointer" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Categories;
