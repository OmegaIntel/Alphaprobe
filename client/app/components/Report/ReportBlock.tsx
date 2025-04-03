import React from 'react';
import Query from './Query';
import { ConversationData } from './reportUtils';
import GeneratedResponse from './GeneratedResponse';


interface ReportBlockProps {
  orderedData: ConversationData[];
}

const ReportBlock: React.FC<ReportBlockProps> = ({
  orderedData,
}) => {

  return (
    <>
      {orderedData.map((data, index) => {
        return (
          <>
            {data.query && <Query key={index} question={data.query} />}
            {data.res && <GeneratedResponse key={index} sections={data.sections} response={data.res} researchType={data.researchType} />}
          </>
        );
      })}
    </>
  );
};

export default ReportBlock;
