import React, { useEffect, useState } from "react";
import { Card, Button } from "antd";
import { CloseOutlined, DeleteFilled, SaveFilled } from "@ant-design/icons";
import Markdown from "react-markdown";
const EditableProjectCard = ({
  project,
  onSave,
  onCancel,
  onEdit,
}) => {
  const [cardText, setCardText] = useState();
  useEffect(()=>{
    setCardText(project?.text);
  }, [project.text,project.isEditing])
  return (
    <Card
      className="text-center bg-[#1f1e23] shadow-lg rounded-lg border-none text-white"
      onDoubleClick={() => onEdit(project.id)}
    >
      <div className="flex flex-col items-center">
        {project.isEditing ? (
          <div className="flex flex-row items-start w-full">
            <div className="w-[95%]">
              <textarea
                value={cardText}
                onChange={(e) =>
                  setCardText(e.target.value)
                }
                placeholder="Description"
                className="mb-2 p-2 rounded-md bg-[#151518] w-full h-32"
              />
            </div>
            <div className="flex flex-col gap-3 ml-3">
              <Button
                onClick={() => {onSave(project.id, cardText)}}
                type="primary"
              >
                <SaveFilled />
              </Button>
              <Button onClick={() => onCancel(project.id, true)} type="default">
                <DeleteFilled />
              </Button>
              <Button onClick={()=>onCancel(project.id, false)}>
                <CloseOutlined/>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-row justify-between w-full max-h-32 overflow-auto">
            <div className="text-sm mt-3 mb-3 mr-3 text-left whitespace-pre-wrap">
              <Markdown>{project.text}</Markdown>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EditableProjectCard;
