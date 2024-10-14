import React, { useEffect } from "react";
import FileUploadComponent from ".";
import { useParams } from "react-router-dom";
import UploadFilesModal from "../UploadFilesModal";
import { getDealId } from "../../services/magicLink";
import { notification } from "antd";
import Navbar from "../Navbar";
import { useDispatch } from "react-redux";
import { setDealId } from "../../redux/dealsSlice";

const DocumentsWrapper = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  useEffect(() => {
    if (id) {
      const payload = {
        token: id,
      };
      getDealId(payload)
        .then((data) => dispatch(setDealId(data.deal_id)))
        .catch((e) => {
          console.log(e);
          notification.error({ message: "Something went wrong!" });
        });
    }
  }, [id, dispatch]);
  return (
    <>
      <Navbar isPublic={true} />
      <UploadFilesModal isPublic={true} />
      <div className="ml-[-1rem]">
        <FileUploadComponent isPublic={true} />
      </div>
    </>
  );
};

export default DocumentsWrapper;
