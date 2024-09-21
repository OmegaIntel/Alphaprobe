import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axiosInstance from "../../axiosConfig";

import { Input, Layout, Menu } from "antd";
import {
  CalenderIcon,
  DataConnectorsIcon,
  EmailIcon,
  FileOutlinedIcon,
  MagnifyingGlassIcon,
  ShareWithPeopleIcon,
} from "../../constants/IconPack";
import { useModal } from "../UploadFilesModal/ModalContext";

const { Sider } = Layout;
const Sidebar = ({ setToken }) => {
  const { setIsUploadModalVisible, isUploadModalVisible } = useModal();
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  // Fetch token from localStorage
  const token = localStorage.getItem("token");

  // Function to fetch and sort sessions by time
  const fetchAndSortSessions = async () => {
    try {
      const response = await axiosInstance.get("/chat/sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const sortedSessions = response.data.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      ); // Sort sessions by time
      setSessions(sortedSessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    }
  };

  useEffect(() => {
    fetchAndSortSessions();

    // Set up an interval to refresh the list every 5 seconds
    const intervalId = setInterval(() => {
      fetchAndSortSessions();
    }, 5000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [token]);

  const handleLogout = () => {
    if (setToken) {
      setToken(""); // Clear the authentication token
    }
    localStorage.removeItem("token"); // Clear the token from local storage
    navigate("/login"); // Redirect to the login page
  };

  const createNewSession = async () => {
    try {
      const response = await axiosInstance.post(
        "/chat/sessions",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newSession = response.data;
      setSessions([newSession, ...sessions]); // Add the new session at the top of the list
      navigate(`/chat/${newSession.id}`);
    } catch (error) {
      console.error("Error creating new session:", error);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axiosInstance.delete(`/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSessions(sessions.filter((session) => session.id !== sessionId)); // Remove deleted session from the list
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  return (
    <Layout hasSider>
      <Sider
        width={250}
        className="bg-[#151518] h-screen text-white"
        style={{ backgroundColor: "#151518" }}
      >
        <div className="p-3 text-center">
          <img src="/images/logo.png" alt="" />
        </div>
        <div className="px-4 relative">
          <input className="rounded mb-6 bg-[#212126] border border-[#303038] focus:bg-[#212126] hover:bg-[#212126] outline-none py-1 px-6 w-[95%]" />
          <div className="absolute top-2 left-5">
            <MagnifyingGlassIcon />
          </div>
        </div>
        <div className="flex flex-col justify-between  h-full">
          <Menu
            mode="inline"
            theme="dark"
            className="bg-transparent text-white h-[65%] "
            defaultSelectedKeys={["1"]}
          >
            <Menu.Item
              key="1"
              icon={<FileOutlinedIcon />}
              className="!flex !items-center"
            >
              Dashboard
            </Menu.Item>
            <Menu.Item
              key="2"
              icon={<FileOutlinedIcon />}
              className="!flex !items-center "
            >
              Templates
            </Menu.Item>

            <Menu.ItemGroup title="MY WORKSPACE"></Menu.ItemGroup>

            <Menu.SubMenu
              title="DATA SOURCE INTEGRATION"
              style={{ backgroundColor: "transparent" }}
              theme="dark"
            >
              <Menu.Item
                key="4"
                icon={<DataConnectorsIcon />}
                className="!flex !items-center gap-3 !bg-transparent"
                onClick={() => setIsUploadModalVisible(!isUploadModalVisible)}
              >
                Upload Files
              </Menu.Item>
            </Menu.SubMenu>
          </Menu>
          <div className="flex flex-col gap-3 h-[35%] w-[85%] mx-auto">
            <div className="p-3 bg-[#1F1E23] rounded font-bold">
              Omega Terminal
            </div>
            <span className="text-xs">
              Email{" "}
              <a
                className="text-[#33BBFF]"
                href="mailto:chetan@omegaintelligence.org"
              >
                chetan@omegaintelligence.org
              </a>{" "}
              for support.
            </span>
            <div className="flex gap-3 justify-center">
              <div className="p-3 rounded bg-[#303038] border border-[#46464F] hover:bg-[#0088CC] hover:border-[#0088CC] cursor-pointer ">
                <EmailIcon />
              </div>
              <div className="p-3 rounded bg-[#303038] border border-[#46464F] hover:bg-[#0088CC] hover:border-[#0088CC] cursor-pointer ">
                <CalenderIcon />
              </div>
              <div className="p-3 rounded bg-[#303038] border border-[#46464F] hover:bg-[#0088CC] hover:border-[#0088CC] cursor-pointer ">
                <ShareWithPeopleIcon />
              </div>
            </div>
          </div>
        </div>
      </Sider>
    </Layout>
  );
};

export default Sidebar;
