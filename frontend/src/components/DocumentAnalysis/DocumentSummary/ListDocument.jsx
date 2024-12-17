import React from "react";
import ListDocumentCard from "./ListDocumentCard/ListDocumentCard";
import ListDocumentHeader from "./ListDocumentCard/ListDocumentHeader";

const ListDocument = () => {
  return (
    <div className="w-1/5">
      <div>
        <ListDocumentHeader />
      </div>
      <ListDocumentCard
        date={"12/02/2024"}
        heading={"Some Report heading"}
        score={"3.2"}
        type={"Financial"}
      />
      <ListDocumentCard
        date={"12/02/2024"}
        heading={"Some Report heading"}
        score={"3.2"}
        type={"Financial"}
      />
      <ListDocumentCard
        date={"12/02/2024"}
        heading={"Some Report heading"}
        score={"3.2"}
        type={"Financial"}
      />
    </div>
  );
};

export default ListDocument;
