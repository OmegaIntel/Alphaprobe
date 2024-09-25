import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { PlusOutlined } from "@ant-design/icons";
import { ReactComponent as CrossIcon } from "../../icons/svgviewer-output_14.svg";
import { EditOutlined } from "@ant-design/icons";
import { SaveOutlined } from "@ant-design/icons";
import { CheckCircleOutlined } from "@ant-design/icons";
import TaskModal from "../createTaskModal";

// Initial columns data
const initialData = {
  todo: {
    name: "To Do",
    items: [
      // { id: "item-1", content: "Request Financials" },
    ],
  },
  inProgress: {
    name: "In Progress",
    items: [],
  },
  done: {
    name: "Done",
    items: [],
  },
};

// Utility functions for reordering and moving items (unchanged)
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
  width: "100%", // Change to 100% for responsive width
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
  minWidth: 400, // Set a minimum width for columns
  maxWidth: 400, // Set a maximum width for columns
  width: "400px", // Fixed width for columns
  alignSelf: "flex-start",
});

const KanbanBoard = () => {
  const [columns, setColumns] = useState(initialData);
  const [editIndex, setEditIndex] = useState(null);
  const [editColumnId, setEditColumnId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
      const result = move(
        columns[source.droppableId].items,
        columns[destination.droppableId].items,
        source,
        destination
      );

      setColumns((prevColumns) => ({
        ...prevColumns,
        [source.droppableId]: {
          ...prevColumns[source.droppableId],
          items: result[source.droppableId],
        },
        [destination.droppableId]: {
          ...prevColumns[destination.droppableId],
          items: result[destination.droppableId],
        },
      }));
    }
  };

  const handleEditClick = (columnId, index) => {
    setEditIndex(index);
    setEditColumnId(columnId);
    setEditContent(columns[columnId].items[index].content);
  };

  const handleSaveEdit = () => {
    if (editColumnId !== null && editIndex !== null) {
      const updatedItems = [...columns[editColumnId].items];
      updatedItems[editIndex].content = editContent;

      setColumns((prevColumns) => ({
        ...prevColumns,
        [editColumnId]: {
          ...prevColumns[editColumnId],
          items: updatedItems,
        },
      }));

      setEditIndex(null);
      setEditColumnId(null);
      setEditContent("");
    }
  };

  const handleAddCard = (columnId) => {
    const newCard = {
      id: `item-${Date.now()}`,
      content: "New Task",
    };
    setColumns((prevColumns) => ({
      ...prevColumns,
      [columnId]: {
        ...prevColumns[columnId],
        items: [...prevColumns[columnId].items, newCard],
      },
    }));
  };

  const handleRemoveCard = (columnId, index) => {
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
  }

  return (
    <div className="flex mx-auto">
      <DragDropContext onDragEnd={onDragEnd} className="m-auto">
        {Object.keys(columns).map((columnId) => (
          <Droppable droppableId={columnId} key={columnId}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={getListStyle(snapshot.isDraggingOver)}
                className="text-black rounded-md p-3 mx-5"
              >
                <div className="text-2xl font-bold m-3">{columns[columnId].name}</div>
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
                          {editIndex === index && editColumnId === columnId ? (
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onBlur={handleSaveEdit}
                              className="border border-black rounded p-2"
                              style={{ width: "100%", flexShrink: 1 }}
                            />
                          ) : (
                            <span style={spanStyle}>
                              {item.content}
                            </span>
                          )}
                          <div style={buttonContainerStyle}>
                            <button onClick={() => handleRemoveCard(columnId, index)}>
                              <CrossIcon />
                            </button>
                            {editIndex === index && editColumnId === columnId ? (
                              <button onClick={handleSaveEdit}><SaveOutlined /></button>
                            ) : (
                              <button onClick={() => handleEditClick(columnId, index)}>
                                <EditOutlined />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <button onClick={() => setIsOpen(true)} className="m-5 flex flex-row">
                  <PlusOutlined className="font-bold text-2xl" />
                  <div className="mx-2">
                    Add a Card
                  </div>
                </button>
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
      <TaskModal onRequestClose={onRequestClose} isOpen={isOpen}/>
    </div>
  );
};

export default KanbanBoard;
