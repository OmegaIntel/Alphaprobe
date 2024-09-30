import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { Input, notification, Tag, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import "./TaskModal.css"; // Custom CSS for styling the modal
import { ReactComponent as CrossIcon } from "../../icons/svgviewer-output_14.svg";
import { createTask, editTasks } from "../../services/taskService";
import { useModal } from "../UploadFilesModal/ModalContext";

// For accessibility, we need to bind the modal to the app element
Modal.setAppElement("#root");

const TaskModal = ({ isOpen, onRequestClose, type, values, setToggle }) => {
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const { dealId } = useModal();

  // Tag-related state
  const [tags, setTags] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editInputIndex, setEditInputIndex] = useState(-1);
  const [editInputValue, setEditInputValue] = useState("");

  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus();
    }
  }, [inputVisible]);

  useEffect(() => {
    if (values) {
      setTaskName(values.taskName || "");
      const dateObj = new Date(values.dueDate);
      const formattedDate = dateObj.toISOString().split("T")[0]; // Get only the date part
      setDueDate(formattedDate);
      setDescription(values.description || "");
      setPriority(values.priority || "");
      setTags(values.tags || []);
    }
  }, [values]);

  useEffect(() => {
    editInputRef.current?.focus();
  }, [editInputValue]);

  const handlePriorityChange = (e) => {
    setPriority(e.target.value);
  };

  const handleCreateTask = () => {
    const formattedDueDate = new Date(dueDate).toISOString();
    const formattedTags = tags.join(", ");
    const taskData = {
      task: taskName,
      status: type,
      due_date: formattedDueDate,
      priority: priority,
      custom_tags: formattedTags,
      description: description,
      deal_id: dealId,
    };
    createTask(taskData)
      .then((data) => {
        setToggle((prev) => !prev);
        notification.success({ message: "Task added successfully!" });
      })
      .catch((e) => {
        notification.error({ message: "Error creating new task!" });
      });
    resetForm();
    onRequestClose(); // Close the modal after submission
  };

  const handleEditTasks = () => {
    const formattedDueDate = new Date(dueDate).toISOString();
    const formattedTags = tags.join(", ");
    const taskData = {
      task: taskName,
      status: type,
      due_date: formattedDueDate,
      priority: priority,
      custom_tags: formattedTags,
      description: description,
    };
    editTasks(values.id, taskData)
      .then((data) => {
        setToggle((prev) => !prev);
        notification.success({ message: "Task edited successfully!" });
      })
      .catch((e) => {
        notification.error({ message: "Error editing new task!" });
      });
    resetForm();
    onRequestClose(); // Close the modal after submission
  };

  // Tag handling logic
  const handleCloseTag = (removedTag) => {
    const newTags = tags.filter((tag) => tag !== removedTag);
    setTags(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      setTags([...tags, inputValue]);
    }
    setInputVisible(false);
    setInputValue("");
  };

  const handleEditInputChange = (e) => {
    setEditInputValue(e.target.value);
  };

  const handleEditInputConfirm = () => {
    const newTags = [...tags];
    newTags[editInputIndex] = editInputValue;
    setTags(newTags);
    setEditInputIndex(-1);
    setEditInputValue("");
  };

  const tagInputStyle = {
    width: 100,
    padding: "6px",
    marginInlineEnd: 8,
    verticalAlign: "top",
  };

  const resetForm = () => {
    setTaskName("");
    setDueDate("");
    setDescription("");
    setPriority("");
    setTags([]);
    setInputVisible(false);
    setInputValue("");
    setEditInputIndex(-1);
    setEditInputValue("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="task-modal"
      overlayClassName="task-modal-overlay"
    >
      <div className="text-xl font-bold flex flex-row justify-between my-2">
        Create a Task
        <CrossIcon
          className="mx-2 cursor-pointer"
          onClick={() => {
            onRequestClose();
            resetForm();
          }}
        />
      </div>
      <div className="modal-content mt-4">
        <div className="bg-[#24242a] p-4 rounded-md">
          <div className="flex flex-row justify-between items-center">
            <div className="form-group flex flex-row items-center">
              <label className="w-[140px]">Task Name</label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-[286px] h-[36px]"
              />
            </div>
            <div className="form-group flex flex-row items-center">
              <label className="w-[120px]">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-grow h-[36px] date-input"
              />
            </div>
          </div>

          <hr className="h-px my-4 bg-gray-200 border-0 dark:bg-[#36363F]" />

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-[80px]"
            />
          </div>

          <div className="flex flex-row mt-5 mb-16">
            <select
              value={priority}
              onChange={handlePriorityChange}
              style={{
                width: 120,
                backgroundColor: "#303038",
                color: "#fff",
                outline: "none",
              }}
              className="p-1 rounded cursor-pointer custom-select"
            >
              <option value="" disabled>
                Priority
              </option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <div className="tags-container mx-10">
              {tags.map((tag, index) => {
                if (editInputIndex === index) {
                  return (
                    <Input
                      ref={editInputRef}
                      key={tag}
                      size="middle"
                      style={tagInputStyle}
                      value={editInputValue}
                      onChange={handleEditInputChange}
                      onBlur={handleEditInputConfirm}
                      onPressEnter={handleEditInputConfirm}
                    />
                  );
                }

                const isLongTag = tag.length > 20;
                const tagElem = (
                  <Tag
                    key={tag}
                    closable={true}
                    closeIcon={<span style={{ color: "white" }}>x</span>}
                    style={{
                      userSelect: "none",
                      backgroundColor: "#303038",
                      text: "white",
                      border: "none",
                      padding: "8px",
                    }}
                    onClose={() => handleCloseTag(tag)}
                  >
                    <span
                      onDoubleClick={(e) => {
                        if (index !== 0) {
                          setEditInputIndex(index);
                          setEditInputValue(tag);
                          e.preventDefault();
                        }
                      }}
                      className="text-white"
                    >
                      {isLongTag ? `${tag.slice(0, 20)}...` : tag}
                    </span>
                  </Tag>
                );
                return (
                  <Tooltip title={tag} key={tag}>
                    {tagElem}
                  </Tooltip>
                );
              })}

              {inputVisible ? (
                <Input
                  ref={inputRef}
                  type="text"
                  size="small"
                  style={tagInputStyle}
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputConfirm}
                  onPressEnter={handleInputConfirm}
                />
              ) : (
                <Tag
                  onClick={showInput}
                  style={{
                    background: "#303038",
                    border: "none",
                    padding: "8px",
                    cursor: "pointer",
                  }}
                  icon={<PlusOutlined className="text-white" />}
                >
                  <span className="text-white">Custom Tag</span>
                </Tag>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions mt-4">
          <button
            onClick={() => {
              onRequestClose();
              resetForm();
            }}
          >
            Cancel
          </button>
          {values !== undefined ? (
            <button onClick={handleEditTasks}>Edit Task</button>
          ) : (
            <button onClick={handleCreateTask}>Create Task</button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TaskModal;
