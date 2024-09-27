import React, { useState, useEffect } from "react";
import DilligenceContainer from "../../dilligence_list/container";
import Subcategories from "../subcategories";
import { categoryList } from "../../../constants";
import FileUploadComponent from "../../FileUploadComponent";
import { MoreOutlined } from "@ant-design/icons";
import AddProgress from "../../progressModal";
import { useModal } from "../../UploadFilesModal/ModalContext";
import { getDeals } from "../../../services/createDealService";
import { notification } from "antd";

const Categories = () => {
  const [isActive, setActive] = useState("Investment Thesis");

  const [progress, setProgress] = useState();
  const [name, setName] = useState("");

  const [toggle, setToggle] = useState(false);

  const { dealId } = useModal();

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
    }
  }, [dealId, toggle]);

  return (
    <>
      <div className="flex flex-row flex-grow overflow-auto">
        <div className="flex flex-grow flex-col overflow-auto">
          <div className="flex flex-row bg-[#151518] pt-5 px-5 ml-1">
            {categoryList.map((data, index) => {
              return data === isActive ? (
                <div
                  className="bg-[#212126] p-3 rounded-lg cursor-pointer"
                  key={index}
                >
                  {data}
                </div>
              ) : (
                <div
                  key={index}
                  className=" cursor-pointer p-3"
                  onClick={() => setActive(data)}
                >
                  {data}
                </div>
              );
            })}
          </div>
          {isActive === "Action Items" ? (
            <DilligenceContainer />
          ) : isActive === "Documents" ? (
            <FileUploadComponent />
          ) : (
            <Subcategories isActiveCategory={isActive} />
          )}
        </div>
        <div>
          <div className="w-80 bg-black p-2 flex flex-row justify-between">
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
