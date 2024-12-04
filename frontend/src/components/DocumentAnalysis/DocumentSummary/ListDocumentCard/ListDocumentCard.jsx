import React from "react";
import DescriptionIcon from '@mui/icons-material/Description';

const ListDocumentCard = ({ heading, type, date, score }) => {
  return (
    <div className="flex space-x-2 m-3">
      <div><DescriptionIcon className="text-gray-500" /></div>
      <div className="space-y-2">
        <div>
          <p className="text-gray-200 text-base">{heading}</p>
          <p className="text-gray-400 text-xs">{date}</p>
        </div>
        <div className="flex justify-between items-center space-x-2 text-sm ">
          <p className="bg-blue-950 p-1 px-2 text-blue-200 rounded-lg">{type}</p>
          <p>Score:{score}</p>
        </div>
      </div>
    </div>
  );
};

export default ListDocumentCard;
