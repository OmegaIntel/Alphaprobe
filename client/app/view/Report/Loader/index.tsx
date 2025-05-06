import { FC } from "react";

const Loader : FC = () => {
    return (
      <div className="flex justify-center mb-96 py-4">
        <div className="animate-pulse flex space-x-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        </div>
      </div>
    );
  };
  
  export default Loader; 