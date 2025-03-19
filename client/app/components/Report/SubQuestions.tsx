import React from "react";
import { Sparkles } from "lucide-react";

interface SubQuestionsProps {
  metadata: string[];
  handleClickSuggestion: (value: string) => void;
}

const SubQuestions: React.FC<SubQuestionsProps> = ({ metadata, handleClickSuggestion }) => {
  return (
    <div className="container flex w-full items-start gap-3 pt-5 pb-2">
      <div className="flex w-fit items-center gap-4">
        <Sparkles className='w-4 h-4 text-gray-600' />
      </div>
      <div className="grow text-gray-600">
        <p className="pr-5 font-bold leading-[152%] text-gray-600 pb-[20px]">
          Pondering your question from several angles
        </p>
        <div className="flex flex-row flex-wrap items-center gap-2.5 pb-[20px]">
          {metadata.map((item, subIndex) => (
            <div
              className="flex cursor-pointer items-center justify-center gap-[5px] rounded-full border border-solid text-gray-600 bg-gray-200 px-2.5 py-2"
              onClick={() => handleClickSuggestion(item)}
              key={`${item}-${subIndex}`}
            >
              <span className="text-sm font-light leading-[normal] text-[#1B1B16]">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubQuestions;