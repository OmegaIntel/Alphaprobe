import { GlobeLock } from "lucide-react";
interface QuestionProps {
  question: string;
}

const Query: React.FC<QuestionProps> = ({ question }) => {
  return (
    <div className="container w-full flex flex-col sm:flex-row items-start gap-3 pt-5 mb-5">
      <div className="bg-gray-100 flex items-center gap-2 sm:gap-4 p-2 rounded-lg">
        <GlobeLock className="w-4 h-4 text-gray-600" />
        <div className="grow text-sm text-gray-600 break-words max-w-full log-message">{question}</div>
      </div>
      
    </div>
  );
};

export default Query;