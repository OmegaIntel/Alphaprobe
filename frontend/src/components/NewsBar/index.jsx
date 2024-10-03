import React, { useEffect, useState } from "react";
import { fetchNewsFeed } from "../../services/newService";
import { Spin, Alert } from "antd";
const NewsBar = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchNewsFeed();
        setNewsData(response);
      } catch (error) {
        console.error("Error fetching news data:", error);
        setError(
          "There was an error fetching the news. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchNewsData();
  }, []);
  return (
    <div className="bg-[#151518] w-[30%] h-screen ml-1 p-2 overflow-y-auto">
      <h5 className="text-sm font-semibold">Latest PE Markets Deals / News</h5>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-full">
          <Alert message="Error" description={error} type="error" showIcon />
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-2  ">
          {newsData.map((data, index) => (
            <div key={index} className="flex flex-col gap-3 ">
              <a
                className="text-xs text-[#33BBFF] underline"
                href={data.link}
                target="_blank"
                rel="noreferrer"
              >
                {data.title}
              </a>
              <span className="text-xs text-[#A2A2A2] "> {data.pubDate} </span>
              <hr className="w-full h-[1px] bg-[#303038] border-none" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsBar;
