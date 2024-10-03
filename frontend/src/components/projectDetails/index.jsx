import React, { useEffect, useState } from "react";
import { PlusCircleFilled } from "@ant-design/icons";
import EditableProjectCard from "./editableCards";
import {
  createWorkspace,
  deleteWorkspace,
  editWorkspace,
  getWorkspace,
} from "../../services/currentWorkspace";
import { Button, notification } from "antd";
import {
  createKnoledgeBase,
  deleteKnowledgebase,
  editKnowledgebase,
  getKnoledgeBase,
} from "../../services/currentKnoledgeBase";
import {
  createChecklist,
  deleteChecklist,
  editChecklist,
  getChecklist,
} from "../../services/currentChecklist";
import { useModal } from "../UploadFilesModal/ModalContext";

const ProjectDetails = ({ isActiveCategory, isActiveSubCategory }) => {
  const { dealId } = useModal();

  const [toggle, setToggle] = useState(false);
  const [projects, setProjects] = useState([]);

  const handleError = (e) => {
    setProjects([]);
    if (e.response.status !== 404) {
      notification.error({ message: "Error fetching data..." });
    }
  };

  useEffect(() => {
    if (isActiveSubCategory && isActiveCategory && dealId) {
      if (isActiveSubCategory === "Current Workspace") {
        getWorkspace(dealId, isActiveCategory)
          .then((data) => {
            setProjects(data);
          })
          .catch((e) => {
            handleError(e);
          });
      } else if (isActiveSubCategory === "Knowledge Base") {
        getKnoledgeBase(dealId, isActiveCategory)
          .then((data) => {
            setProjects(data);
          })
          .catch((e) => {
            handleError(e);
          });
      } else if (isActiveSubCategory === "Checklist") {
        getChecklist(dealId, isActiveCategory)
          .then((data) => {
            setProjects(data);
          })
          .catch((e) => {
            handleError(e);
          });
      } else {
        setProjects([]);
      }
    }
  }, [isActiveCategory, isActiveSubCategory, toggle, dealId]);

  const addProject = () => {
    // Since you're adding a new project, you don't assign an id on the client-side.
    const newProject = { text: "", isEditing: true };

    // Make an API call to save the new project
    if (isActiveSubCategory === "Current Workspace") {
      const workspaceData = {
        type: isActiveCategory,
        text: newProject.text, // initially empty
        deal_id: dealId,
      };

      createWorkspace(workspaceData)
        .then((data) => {
          // Once the project is saved, the backend will return a response with the id and other data
          const savedProject = { ...newProject, id: data.id, isEditing: true };

          // Add the newly created project to the state
          setProjects((prevProjects) => [...prevProjects, savedProject]);
        })
        .catch((e) => {
          notification.error({
            message: `Something Went Wrong In Saving ${isActiveSubCategory}`,
          });
        });
    } else if (isActiveSubCategory === "Knowledge Base") {
      const knowledgeData = {
        type: isActiveCategory,
        text: newProject.text, // initially empty
        deal_id: dealId,
      };

      createKnoledgeBase(knowledgeData)
        .then((data) => {
          // Once the project is saved, the backend will return a response with the id and other data
          const savedProject = { ...newProject, id: data.id, isEditing: true };

          // Add the newly created project to the state
          setProjects((prevProjects) => [...prevProjects, savedProject]);
        })
        .catch((e) => {
          notification.error({
            message: `Something Went Wrong In Saving ${isActiveSubCategory}`,
          });
        });
    } else {
      const checkListData = {
        type: isActiveCategory,
        text: newProject.text, // initially empty
        deal_id: dealId,
      };

      createChecklist(checkListData)
        .then((data) => {
          // Once the project is saved, the backend will return a response with the id and other data
          const savedProject = { ...newProject, id: data.id, isEditing: true };

          // Add the newly created project to the state
          setProjects((prevProjects) => [...prevProjects, savedProject]);
        })
        .catch((e) => {
          notification.error({
            message: `Something Went Wrong In Saving ${isActiveSubCategory}`,
          });
        });
    }
  };

  const handleInputChange = (id, field, value) => {
    const updatedProjects = projects.map((project) =>
      project.id === id ? { ...project, [field]: value } : project
    );
    setProjects(updatedProjects);
  };

  const saveProject = async (id, description) => {
    const updatePayload = {
      type: isActiveCategory,
      text: description,
    };

    if (isActiveSubCategory === "Current Workspace") {
      editWorkspace(id, updatePayload)
        .then(() => {
          setToggle((prev) => !prev);
          notification.success({
            message: `Successfully edited ${isActiveSubCategory}`,
          });
        })
        .catch((e) => {
          notification.error({
            message: `Something Went Wrong In Updating ${isActiveSubCategory}`,
          });
        });
    } else if (isActiveSubCategory === "Knowledge Base") {
      editKnowledgebase(id, updatePayload)
        .then(() => {
          setToggle((prev) => !prev);
          notification.success({
            message: `Successfully edited ${isActiveSubCategory}`,
          });
        })
        .catch((e) => {
          notification.error({
            message: `Something Went Wrong In Updating ${isActiveSubCategory}`,
          });
        });
    } else {
      editChecklist(id, updatePayload)
        .then(() => {
          setToggle((prev) => !prev);
          notification.success({
            message: `Successfully edited ${isActiveSubCategory}`,
          });
        })
        .catch((e) => {
          notification.error({
            message: `Something Went Wrong In Updating ${isActiveSubCategory}`,
          });
        });
    }
  };

  const cancelEdit = (id, isRemove) => {
    if (isRemove) {
      if (isActiveSubCategory === "Current Workspace") {
        deleteWorkspace(id)
          .then(() => {
            setToggle((prev) => !prev);
            notification.success({ message: "Successfully removed!" });
          })
          .catch((e) => {
            notification.error({
              message: `Something Went Wrong In Removing ${isActiveSubCategory}`,
            });
          });
      } else if (isActiveSubCategory === "Knowledge Base") {
        deleteKnowledgebase(id)
          .then(() => {
            setToggle((prev) => !prev);
            notification.success({ message: "Successfully removed!" });
          })
          .catch((e) => {
            notification.error({
              message: `Something Went Wrong In Removing ${isActiveSubCategory}`,
            });
          });
      } else {
        deleteChecklist(id)
          .then(() => {
            setToggle((prev) => !prev);
            notification.success({ message: "Successfully removed!" });
          })
          .catch((e) => {
            notification.error({
              message: `Something Went Wrong In Removing ${isActiveSubCategory}`,
            });
          });
      }
    }
  };

  const editProject = (id) => {
    const updatedProjects = projects.map((project) =>
      project.id === id ? { ...project, isEditing: true } : project
    );
    setProjects(updatedProjects);
  };

  return (
    <>
      <div className="flex-grow overflow-y-auto bg-[#151518] ml-1">
        <Button
          className="absolute bottom-5 right-[345px] z-10 cursor-pointer"
          onClick={addProject}
          icon={<PlusCircleFilled style={{ fontSize: "30px" }} />}
          style={{ padding: "12px 24px", fontSize: "16px", height: "48px" }}
        />
        <div className="grid grid-cols-1 gap-4 p-4">
          {projects?.map((project) => (
            <EditableProjectCard
              key={project.id}
              project={project}
              onSave={saveProject}
              onCancel={cancelEdit}
              onEdit={editProject}
              handleInputChange={handleInputChange}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;
