import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { PlusOutlined } from "@ant-design/icons";
import { ReactComponent as CrossIcon } from "../../icons/svgviewer-output_14.svg";
import { EditOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { deleteTodo, editTasks, getTasks } from "../../services/taskService";
import TaskModal from "../createTaskModal";
import { notification, Spin } from "antd";
import { useModal } from "../UploadFilesModal/ModalContext";

// Utility functions for reordering and moving items
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);
  destClone.splice(droppableDestination.index, 0, removed);

  return {
    [droppableSource.droppableId]: sourceClone,
    [droppableDestination.droppableId]: destClone,
  };
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  background: isDragging ? "lightgreen" : "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  minHeight: "50px",
  width: "100%",
  overflow: "hidden",
  ...draggableStyle,
  borderRadius: "10px",
  boxShadow: isDragging
    ? "0 8px 16px rgba(0, 0, 0, 0.3)"
    : "0 4px 8px rgba(0, 0, 0, 0.1)",
});

const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? "lightblue" : "#ebecf0",
  padding: grid,
  minWidth: 340,
  maxWidth: 340,
  width: "340px",
  alignSelf: "flex-start",
});

const KanbanBoard = () => {
  const [loading, setLoading] = useState(false);
  const initialState = useMemo(
    () => ({
      todo: {
        name: "To Do",
        items: [],
      },
      inProgress: {
        name: "In Progress",
        items: [],
      },
      done: {
        name: "Done",
        items: [],
      },
    }),
    []
  );
  const [columns, setColumns] = useState(initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("");
  const [values, setValues] = useState();
  const { dealId, setTodo } = useModal();
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    getTasks(dealId)
      .then((data) => {
        setTodo(data);
        // Distribute tasks into columns based on their status
        const todoItems = [];
        const inProgressItems = [];
        const doneItems = [];

        data.forEach((task) => {
          const taskItem = {
            id: task.id,
            content: task.task,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            tags: task.custom_tags.split(",").map((item) => item.trim()),
          };

          switch (task.status) {
            case "To Do":
              todoItems.push(taskItem);
              break;
            case "In Progress":
              inProgressItems.push(taskItem);
              break;
            case "Done":
              doneItems.push(taskItem);
              break;
            default:
              break;
          }
        });

        setColumns({
          todo: { name: "To Do", items: todoItems },
          inProgress: { name: "In Progress", items: inProgressItems },
          done: { name: "Done", items: doneItems },
        });
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setColumns(initialState);
      });
  }, [dealId, toggle, initialState, setTodo]);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const items = reorder(
        columns[source.droppableId].items,
        source.index,
        destination.index
      );

      setColumns((prevColumns) => ({
        ...prevColumns,
        [source.droppableId]: {
          ...prevColumns[source.droppableId],
          items,
        },
      }));
    } else {
      const result_new = move(
        columns[source.droppableId].items,
        columns[destination.droppableId].items,
        source,
        destination
      );

      setColumns((prevColumns) => ({
        ...prevColumns,
        [source.droppableId]: {
          ...prevColumns[source.droppableId],
          items: result_new[source.droppableId],
        },
        [destination.droppableId]: {
          ...prevColumns[destination.droppableId],
          items: result_new[destination.droppableId],
        },
      }));

      const movedTask = columns[source.droppableId].items;

      const status = columns[destination.droppableId].name;

      const task = movedTask.find((t) => t.id === result.draggableId);

      const formattedDueDate = new Date(task.due_date).toISOString();
      const formattedTags = task.tags.join(", ");

      const taskData = {
        task: task.content,
        status: status,
        due_date: formattedDueDate,
        priority: task.priority,
        custom_tags: formattedTags,
        description: task.description,
      };

      // Call the API to update the task with all data
      editTasks(result.draggableId, taskData)
        .then(() => {
          notification.success({
            message: "Task updated successfully!",
          });
          setToggle((prev) => !prev);
        })
        .catch((err) => {
          console.error("Error updating task:", err);
          notification.error({
            message: "Failed to update task",
          });
        });
    }
  };

  const handleEditClick = (name, columnId, index, columns) => {
    const taskToEdit = columns[columnId].items[index];

    setValues({
      id: taskToEdit.id,
      taskName: taskToEdit.content,
      dueDate: taskToEdit.due_date,
      description: taskToEdit.description,
      priority: taskToEdit.priority,
      tags: taskToEdit.tags || [], // Assuming tags is a field
    });

    setIsOpen(true); // Open the modal
    setType(name);
  };

  const handleRemoveCard = (columnId, index, id) => {
    setLoading(true);
    deleteTodo(id)
      .then(() => {
        setToggle((prev) => !prev);
      })
      .catch(() => {
        notification.error({ message: "Error in removing task!" });
      })
      .finally(() => setLoading(false));
    const updatedItems = columns[columnId].items.filter((_, i) => i !== index);
    setColumns((prevColumns) => ({
      ...prevColumns,
      [columnId]: {
        ...prevColumns[columnId],
        items: updatedItems,
      },
    }));
  };

  const spanStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    overflowWrap: "break-word",
    flexGrow: 1,
  };

  const buttonContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    marginLeft: "8px",
  };

  const onRequestClose = () => {
    setIsOpen(false);
    setValues();
  };

  return (
    <div className="flex mx-auto">
      {loading ? <Spin /> : <>
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.keys(columns).map((columnId) => (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}
                  className="text-black rounded-md p-3 mx-5"
                >
                  <div className="text-2xl font-bold m-3">
                    {columns[columnId].name}
                  </div>
                  {columns[columnId].items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          className="card"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                          )}
                        >
                          <div style={{ display: "flex", width: "100%" }}>
                            <div className="mr-2">
                              <CheckCircleOutlined />
                            </div>
                            <span style={spanStyle}>{item.content}</span>
                            <div style={buttonContainerStyle}>
                              <button
                                onClick={() =>
                                  handleRemoveCard(
                                    columnId,
                                    index,
                                    columns[columnId].items[index].id
                                  )
                                }
                              >
                                <CrossIcon />
                              </button>
                              <button
                                onClick={() =>
                                  handleEditClick(
                                    columns[columnId].name,
                                    columnId,
                                    index,
                                    columns
                                  )
                                }
                              >
                                <EditOutlined />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <button
                    onClick={() => {
                      setIsOpen(true);
                      setType(columns[columnId].name);
                    }}
                    className="m-5 flex flex-row"
                  >
                    <PlusOutlined className="font-bold text-2xl" />
                    <div className="mx-2">Add a Card</div>
                  </button>
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
        <TaskModal
          onRequestClose={onRequestClose}
          isOpen={isOpen}
          type={type}
          values={values}
          setToggle={setToggle}
        />
      </>}
    </div>
  );
};

export default KanbanBoard;
