import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout, Menu } from "antd";
import {
  CalenderIcon,
  EmailIcon,
  FileOutlinedIcon,
  MagnifyingGlassIcon,
  ShareWithPeopleIcon,
} from "../../constants/IconPack";
import { getDeals } from "../../services/dealService";
import { PlusOutlined } from "@ant-design/icons";

const { Sider } = Layout;
const Sidebar = () => {
  const [deals, setDeals] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchDealsData = async () => {
      try {
        const data = await getDeals();
        if (data) setDeals(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchDealsData();
  }, []);
  const menuItems = [
    {
      key: "1",
      icon: <FileOutlinedIcon />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "2",
      icon: <FileOutlinedIcon />,
      label: "Templates",
    },
    {
      key: "3",
      label: "MY WORKSPACE",
      children:
        deals.length > 0
          ? deals.map((deal) => ({
              key: deal.id,
              icon: <FileOutlinedIcon />,
              label: deal.name,
            }))
          : [
              {
                key: "no-projects",
                disabled: true,
                label: "No projects available",
              },
            ],
      expandIcon: () => (
        <PlusOutlined
          onClick={(e) => {
            e.stopPropagation();
            navigate("/create-deal");
          }}
        />
      ),
    },
    {
      key: "4",
      label: "DATA SOURCE INTEGRATION",
      children: [], // Add submenu items here if needed
    },
  ];

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
            className="bg-transparent text-white h-[65%]"
            defaultSelectedKeys={["1"]}
            items={menuItems}
          />
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
