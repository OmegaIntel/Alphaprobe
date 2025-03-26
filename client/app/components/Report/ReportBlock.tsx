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
  res: string;
  res_id?: string;
};

interface ReportBlockProps {
  orderedData: ConversationData[];
  sections: Section[];
}

const ReportBlock: React.FC<ReportBlockProps> = ({
  orderedData,
  sections,
}) => {

  return (
    <>
      {orderedData.map((data, index) => {
        return (
          <>
            {data.query && <Query key={index} question={data.query} />}
            {data.res && <GeneratedResponse key={index} sections={sections} />}
          </>
        );
      })}
    </>
  );
};

export default ReportBlock;
