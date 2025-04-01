import { useRef, useState, useEffect } from 'react';
import { Data, ChatBoxSettings, QuestionData } from '../reportUtils';
import { API_BASE_URL } from '~/constant';
import { InitialFormData } from '../reportUtils';

type ConversationData = {
  query: string;
  res: string;
  res_id?: string;
}

export const useWebSocket = (
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setConversation:React.Dispatch<React.SetStateAction<ConversationData[]>>
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const heartbeatInterval = useRef<number>();

  // Cleanup function for heartbeat
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

  const startHeartbeat = (ws: WebSocket) => {
    // Clear any existing heartbeat
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    
    // Start new heartbeat
    heartbeatInterval.current = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 30000); // Send ping every 30 seconds
  };

  const initializeWebSocket = (promptValue: InitialFormData) => {
  

    if (!socket && typeof window !== 'undefined') {
      const fullHost = API_BASE_URL;
      const host = fullHost.replace('http://', '').replace('https://', '');
      const ws_uri = `${fullHost.includes('https') ? 'wss:' : 'ws:'}//${host}/ws`;

      const newSocket = new WebSocket(ws_uri);
      setSocket(newSocket);

      newSocket.onopen = () => {
        let data = "start " + JSON.stringify(promptValue);
        newSocket.send(data);
        startHeartbeat(newSocket);
      };

      newSocket.onmessage = (event) => {
        try {
          // Handle ping response
          if (event.data === 'pong') return;

          // Try to parse JSON data
          const data = JSON.parse(event.data);
            if (data.type === 'report') {
              setConversation((prev: ConversationData[]) => {
                let lastCon = [...prev].pop();
                // console.log('lastCon', lastCon, prev)
                return prev.map((resData)=> {
                  if(resData.res_id === lastCon?.res_id){
                    return {...resData, res: resData.res + data.output}
                  }
                  return resData;

                });
              })
            } else if (data.type === 'END') {
              setLoading(false);
              newSocket.close();
            }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };

      newSocket.onclose = () => {
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
        setSocket(null);
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
      };
    }
  };

  return { socket, setSocket, initializeWebSocket };
};