import React from 'react';
import Query from './Query';
import SubQuestions from './SubQuestions';
import AgentLogs from './AgentLog';
import { preprocessOrderedData, Data } from './reportUtils';
import GeneratedResponse from './GeneratedResponse';

type Section = {
  name: string;
  description: string;
  research: boolean;
  content: string;
  citations: any[];
};

type ConversationData = {
  query: string;
  res: Section[];
  res_id?: string;
};

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
            {data.res && <GeneratedResponse key={index} sections={data.res} />}
          </>
        );
      })}
    </>
  );
};

export default ReportBlock;
