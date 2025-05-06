import LogMessages from './LogMessages';
import { useEffect, useRef } from 'react';
import { ClipboardCheck } from 'lucide-react';

interface Log {
  header: string;
  text: string;
  metadata: any;
  key: string;
}

interface OrderedLogsProps {
  logs: Log[];
}

const LogsSection = ({ logs }: OrderedLogsProps) => {
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever logs change
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]); // Dependency on logs array ensures this runs when new logs are added

  return (
    <div className="container h-auto w-full shrink-0 rounded-lg border border-solid border-[#C2C2C2] bg-gray-800 shadow-md p-5 mt-5">
      <div className="flex items-start gap-4 pb-3 lg:pb-3.5">
        <ClipboardCheck className='w-4 h-5 text-green-600' />
        <h3 className="text-base font-bold uppercase leading-[152.5%] text-gray-600">
          Agent Work
        </h3>
      </div>
      <div 
        ref={logsContainerRef}
        className="overflow-y-auto min-h-[200px] max-h-[500px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300"
      >
        <LogMessages logs={logs} />
      </div>
    </div>
  );
};

export default LogsSection; 