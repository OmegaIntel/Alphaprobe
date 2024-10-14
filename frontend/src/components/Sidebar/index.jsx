import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { Layout, Menu } from "antd";
import {
  FileOutlinedIcon,
  MagnifyingGlassIcon,
  ShareWithPeopleIcon,
} from "../../constants/IconPack";
import { getDeals } from "../../services/dealService";
import { LogoutOutlined, PlusOutlined } from "@ant-design/icons";
import SendEmail from "../modals/send_email";
import AddCollaboration from "../collaborationModal";
import { ReactComponent as FileUpload } from "../../icons/file_upload.svg";
import CalendlyModal from "../CalendlyModal";
import { useDispatch, useSelector } from "react-redux";
import { setDealId, setDeals } from "../../redux/dealsSlice";
import {
  setIsFileUploadModule,
  setIsUploadModalVisible,
} from "../../redux/modalSlice";

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dealId, deals } = useSelector((state) => state.deals);
  const [filteredDeals, setFilteredDeals] = useState(deals);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();

  const onRequestClose = () => {
    setIsOpen(false);
  };
  useEffect(() => {
    const fetchDealsData = async () => {
      try {
        const data = await getDeals();
        if (data) {
          dispatch(setDeals(data));
          setFilteredDeals(data);
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchDealsData();
  }, [dealId, dispatch]);

  useEffect(() => {
    const results = deals.filter((deal) =>
      deal.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredDeals(results);
  }, [search, deals]);

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
      disabled: true,
    },
    {
      key: "3",
      label: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>MY WORKSPACE</span>
          <PlusOutlined
            onClick={(e) => {
              e.stopPropagation();
              navigate("/create-deal");
            }}
            style={{ cursor: "pointer" }}
          />
        </div>
      ),
      type: "group",
    },
    ...(filteredDeals.length > 0
      ? filteredDeals.map((deal) => ({
          key: deal.id,
          icon: <FileOutlinedIcon />,
          label: (
            <Link
              to={`/projects/${deal.id}`}
              onClick={() => dispatch(setDealId(deal.id))}
            >
              {deal.name}
            </Link>
          ),
        }))
      : [
          {
            key: "no-projects",
            disabled: true,
            label: "No projects available",
          },
        ]),
    {
      key: "4",
      label: "DATA SOURCE INTEGRATION",
      children: [],
    },
    {
      key: "5",
      label: (
        <div className="flex flex-row items-center gap-3">
          <FileUpload /> File Upload
        </div>
      ),
      onClick: () => {
        dispatch(setIsUploadModalVisible(true));
        dispatch(setIsFileUploadModule(true));
      },
    },
  ];

  const currentDealId = location.pathname.startsWith("/projects/")
    ? location.pathname.split("/projects/")[1]
    : null;

  const selectedKey =
    location.pathname === "/dashboard" ? "1" : currentDealId || "";

  return (
    <Layout hasSider>
      <Sider
        className="bg-[#151518] sidebar h-screen text-white"
        style={{ backgroundColor: "#151518" }}
      >
        <div className="p-3 text-center">
          <img src="/images/logo.png" alt="" />
        </div>
        <div className="px-4 relative">
          <input
            className="rounded mb-6 bg-[#212126] border border-[#303038] focus:bg-[#212126] hover:bg-[#212126] outline-none py-1 px-6 w-[95%]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute top-2 left-5">
            <MagnifyingGlassIcon />
          </div>
        </div>
        <div className="flex flex-col justify-between  h-full">
          <Menu
            mode="inline"
            theme="dark"
            className="bg-transparent text-white laptop:h-[55%] desktop:h-[60%]  h-[60%]"
            defaultSelectedKeys={[selectedKey]}
            items={menuItems}
            style={{ maxHeight: "800px", overflowY: "auto" }}
          />
          <div className="flex flex-col gap-3 laptop:h-[45%] desktop:h-[40%] h-[40%]  w-[85%] mx-auto">
            <button className="p-3 bg-[#1F1E23] text-left rounded font-bold">
              Omega Terminal
            </button>
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
              <SendEmail />
              <CalendlyModal />
              <div
                className="p-2 rounded bg-[#303038] border border-[#46464F] hover:bg-[#0088CC] hover:border-[#0088CC] cursor-pointer "
                onClick={() => setIsOpen(true)}
              >
                <ShareWithPeopleIcon />
              </div>
              <a
                className="p-2 rounded bg-[#303038] border border-[#46464F] hover:bg-[#0088CC] hover:border-[#0088CC] cursor-pointer "
                onClick={() => {
                  localStorage.removeItem("token");
                }}
                href="/login"
              >
                <LogoutOutlined />
              </a>
            </div>
          </div>
        </div>
      </Sider>
      <AddCollaboration isOpen={isOpen} onRequestClose={onRequestClose} />
    </Layout>
  );
};

export default Sidebar;
