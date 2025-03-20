import React from 'react';
import Query from './Query';
import SubQuestions from './SubQuestions';
import AgentLogs from './AgentLog';
import { preprocessOrderedData, Data } from './reportUtils';
import GeneratedResponse from './GeneratedResponse';

interface ReportBlockProps {
  orderedData: Data[];
  response: string;
  allLogs: any[];
  chatBoxSettings: any;
  handleClickSuggestion: (value: string) => void;
}

const ReportBlock: React.FC<ReportBlockProps> = ({
  orderedData,
  response,
  allLogs,
  chatBoxSettings,
  handleClickSuggestion
}) => {
  const groupedData = preprocessOrderedData(orderedData);
  const initialQuestion = groupedData.find(data => data.type === 'question');

  const chatComponents = groupedData
    .filter(data => {
      if (data.type === 'question' && data === initialQuestion) {
        return false;
      }
      return (data.type === 'question' || data.type === 'chat');
    })
    .map((data, index) => {
      if (data.type === 'question') {
        return <Query key={`question-${index}`} question={data.content} />;
      } else {
        return <GeneratedResponse key={`chat-${index}`} response={data.content} />;
      }
    });

  const finalReport = groupedData
    .filter(data => data.type === 'reportBlock')
    .pop();
  const subqueriesComponent = groupedData.find(data => data.content === 'subqueries');

  return (
    <>
      {initialQuestion && <Query question={initialQuestion.content} />}
      {finalReport && <GeneratedResponse response={finalReport.content} />}
      {subqueriesComponent && (
        <SubQuestions
          metadata={subqueriesComponent.metadata}
          handleClickSuggestion={handleClickSuggestion}
        />
      )}
      {chatComponents}
    </>
  );
}; 

export default ReportBlock;