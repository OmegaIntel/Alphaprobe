import React, { useEffect, useState } from "react";
import { Spin, message } from "antd";
import Markdown from "react-markdown";
import {
  RobotOutlined,
  LoadingOutlined,
  LikeOutlined,
  DislikeOutlined,
  CopyOutlined,
  LikeFilled,
  DislikeFilled,
} from "@ant-design/icons";
import { handleLikeDislike } from "../../../services/chatService";

const ChatMessages = ({
  loading,
  error,
  messages,
  currentChatSession,
  isLoadingMessage,
  handleAddMessageToWorkSpace,
}) => {
  const [likedMessages, setLikedMessages] = useState({});
  const [dislikedMessages, setDislikedMessages] = useState({});

  useEffect(() => {
    if (messages) {
      messages.forEach((msg) => {
        if (msg.like_dislike === "like") {
          setLikedMessages((prev) => ({
            ...prev,
            [msg.id]: true,
          }));
        }
        if (msg.like_dislike === "dislike") {
          setDislikedMessages((prev) => ({
            ...prev,
            [msg.id]: true,
          }));
        }
      });
    }
  }, [messages]);

  const toggleLike = (msgId) => {
    if (likedMessages[msgId]) {
      // If already liked, set status to None (reset like)
      setLikedMessages((prev) => ({
        ...prev,
        [msgId]: false,
      }));
      handleLikeDislike(msgId, "none")
        .then()
        .catch((e) => message.error("Something went wrong!")); // Use None to reset
    } else {
      // Otherwise, toggle like
      setLikedMessages((prev) => ({
        ...prev,
        [msgId]: true,
      }));

      // Reset dislike if liked
      if (dislikedMessages[msgId]) {
        setDislikedMessages((prev) => ({
          ...prev,
          [msgId]: false,
        }));
        handleLikeDislike(msgId, "none")
          .then()
          .catch((e) => message.error("Something went wrong!")); // Reset dislike status
      }

      handleLikeDislike(msgId, "like")
        .then()
        .catch((e) => message.error("Something went wrong!"));
    }
  };

  const toggleDislike = (msgId) => {
    if (dislikedMessages[msgId]) {
      // If already disliked, set status to None (reset dislike)
      setDislikedMessages((prev) => ({
        ...prev,
        [msgId]: false,
      }));
      handleLikeDislike(msgId, "none")
        .then()
        .catch((e) => message.error("Something went wrong!")); // Use None to reset
    } else {
      // Otherwise, toggle dislike
      setDislikedMessages((prev) => ({
        ...prev,
        [msgId]: true,
      }));

      // Reset like if disliked
      if (likedMessages[msgId]) {
        setLikedMessages((prev) => ({
          ...prev,
          [msgId]: false,
        }));
        handleLikeDislike(msgId, "None")
          .then()
          .catch((e) => message.error("Something went wrong!")); // Reset like status
      }

      handleLikeDislike(msgId, "dislike")
        .then()
        .catch((e) => message.error("Something went wrong!"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!error && currentChatSession && messages.length > 0) {
    return (
      <>
        {messages?.map((msg, index) => (
          <React.Fragment key={index}>
            <div>
              <div
                className={`py-4 px-[14px] w-fit max-w-[90%] text-sm leading-5 bg-[#001529] ${
                  msg.role === "ai"
                    ? "rounded-[8px] rounded-bl-none"
                    : "rounded-[8px] rounded-br-none ml-auto"
                }`}
              >
                <p>
                  <Markdown>{msg.content}</Markdown>
                </p>
              </div>
            </div>
            <div
              className={`${
                (!msg.id || msg.role === "user") && "hidden"
              } flex flex-row gap-3`}
            >
              {likedMessages[msg.id] ? (
                <LikeFilled
                  className="cursor-pointer"
                  onClick={() => toggleLike(msg.id)}
                />
              ) : (
                <LikeOutlined
                  className="cursor-pointer"
                  onClick={() => toggleLike(msg.id)}
                />
              )}

              {dislikedMessages[msg.id] ? (
                <DislikeFilled
                  className="cursor-pointer"
                  onClick={() => toggleDislike(msg.id)}
                />
              ) : (
                <DislikeOutlined
                  className="cursor-pointer"
                  onClick={() => toggleDislike(msg.id)}
                />
              )}

              <CopyOutlined
                className="cursor-pointer"
                onClick={() => handleAddMessageToWorkSpace(msg.id)}
              />
            </div>
          </React.Fragment>
        ))}
        {isLoadingMessage && (
          <div className="py-4 px-[14px] w-fit max-w-[50%] text-sm leading-5 bg-[#001529] rounded-[8px] rounded-bl-none">
            <LoadingOutlined className="text-white" spin />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-purple-600 rounded-md flex items-center justify-center mx-auto mb-4">
        <RobotOutlined className="text-white" />
      </div>
      <h2 className="text-base font-semibold mb-2">Welcome to Omega Copilot</h2>
      <p className="text-sm mb-2 text-[#F6F6F6]">
        Please select the Data Source for your Research
      </p>
      <p className="text-sm mb-2 text-[#F6F6F6]">
        To chat with only specific widgets, use the icon.
      </p>
      <p className="text-sm mb-2 text-[#F6F6F6]">
        For more information, see our{" "}
        <span className="text-[#9C76DC] underline cursor-pointer ">
          Copilot Documentation
        </span>
      </p>
    </div>
  );
};

export default ChatMessages;
