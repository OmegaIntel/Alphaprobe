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
        console.log(response);
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
    <div className="bg-[#151518] ml-1 p-2 overflow-y-auto">
      <h5 className="text-xl mb-10 font-semibold">Industry News</h5>
      {loading ? (
        <div className="flex justify-center items-center h-[80%]">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-[80%]">
          <Alert description={error} type="error" showIcon />
        </div>
      ) : (
        <div className="flex flex-col  gap-4 mt-4 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800"  >
          {newsData.map((data, index) => (
            <div key={index} className="flex flex-col gap-3 ">
              <div className="flex justify-between">
                <a
                  className="text-base text-white "
                  href={data.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {data.title}
                </a>
                <span className="text-xs text-[#A2A2A2] ">
                  {" "}
                  {data.pubDate}{" "}
                </span>
              </div>
              <hr className="w-full h-[1px] bg-[#303038] border-none" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsBar;
