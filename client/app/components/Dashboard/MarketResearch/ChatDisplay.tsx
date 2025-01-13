import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Sidebar } from './ChatSidebar';

interface Response {
  agent_response: string;
  metadata_content_pairs: any[];
}

interface Interaction {
  query: string;
  response?: Response | string;
  id: string;
}

interface ChatState {
  chat: {
    interactions: Interaction[];
  };
}

const PulsingIndicator = () => {
  return (
    <div className="relative w-2 h-2 bg-blue-500 rounded-full animate-pulse inline-block"></div>
  );
};

export function ChatDisplay() {
  const interactions = useSelector(
    (state: ChatState) => state.chat.interactions
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentRefs, setCurrentRefs] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [interactions]);

  const handleShowReferences = (references: any[]) => {
    setCurrentRefs(references);
    setIsSidebarOpen(true);
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const renderResponse = (response: Response | string | undefined) => {
    if (typeof response === 'string') {
      return formatText(response);
    }

    if (
      response &&
      typeof response === 'object' &&
      'agent_response' in response
    ) {
      return (
        <div className="space-y-2">
          <div className="flex justify-start">
            {formatText(response.agent_response)}
          </div>
          <Button
            variant="link"
            onClick={() =>
              handleShowReferences(response.metadata_content_pairs)
            }
            className="text-blue-500 p-0 h-auto"
          >
            Show References
          </Button>
        </div>
      );
    }

    return <PulsingIndicator />;
  };

  return (
    <>
      <ScrollArea className="h-[calc(100vh-120px)] w-2/3 mx-auto ">
        <div className="flex justify-center">
          <div className="w-3/5 pt-10">
            {interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.map((interaction, index) => (
                  <div key={interaction.id || index} className="space-y-4">
                    <Card className="bg-stone-800 ml-20 border-0">
                      <div className="p-4">
                        {/* User Message */}
                        <div className="text-white">{interaction.query}</div>
                      </div>
                    </Card>

                    {/* Response Message */}
                    <div className="">
                      {renderResponse(interaction.response)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex justify-center items-center h-96">
                <p className="text-stone-300 font-medium text-2xl animate-pulse">
                  No interactions yet. Start a conversation!
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        data={currentRefs}
      />
    </>
  );
}
