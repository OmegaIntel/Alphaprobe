import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { API_BASE_URL } from "~/constant";
import {
  addInteraction,
  updateInteractionResponse,
} from "~/store/slices/chatSlice";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useAuth0 } from "@auth0/auth0-react"

type SessionResponse = {
  session_id: string;
  status?: string;
};

interface SearchResponse {
  session_id: string;
  agent_response: string;
  metadata_content_pairs: any;
}

export function ChatInterface() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth0();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSessionId(localStorage.getItem("rag_session_id") || "");
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncSessionIdWithLocalStorage = () => {
      const storedSessionId = localStorage.getItem("rag_session_id");
      if (storedSessionId && storedSessionId !== sessionId) {
        setSessionId(storedSessionId);
      }
    };

    syncSessionIdWithLocalStorage();
    window.addEventListener("storage", syncSessionIdWithLocalStorage);

    return () => {
      window.removeEventListener("storage", syncSessionIdWithLocalStorage);
    };
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initSession = async () => {
      if (sessionId) {
        await verifySession(sessionId);
      } else {
        await createSession();
      }
    };

    initSession();
  }, [sessionId]);

  const verifySession = async (existingSessionId: string): Promise<void> => {
    if (typeof window === 'undefined') return;

    try {
      if(isAuthenticated && user && user.email) {
        const endpoint = new URL(`${API_BASE_URL}/api/session/verify`);
        endpoint.searchParams.append("session_id", existingSessionId);
        endpoint.searchParams.append("email", user.email); // Append the email parameter

        const response = await fetch(endpoint.toString(), {
          method: "GET",
          headers: {
            "Accept": "application/json"
          },
        });


        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error("Session verification failed");
        }

        const data = await response.json() as SessionResponse;
        if (data.session_id && data.session_id !== existingSessionId) {
          setSessionId(data.session_id);
          localStorage.setItem("rag_session_id", data.session_id);
        }
      } else {
        navigate("/login");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify session",
      });
    }
  };

  const createSession = async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    try {
      if(isAuthenticated && user && user.email) {
        const payload = { email: user.email };
        const response = await fetch(`${API_BASE_URL}/api/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error("Failed to create session");
        }
  
        const data = await response.json() as SessionResponse;
        if (data.session_id) {
          setSessionId(data.session_id);
          localStorage.setItem("rag_session_id", data.session_id);
        }
      } else {
        navigate("/login");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create session",
      });
    }
  };

  const handleSearch = async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    if (!searchQuery.trim()) return;

    const interactionId = uuidv4();
    setIsSearching(true);

    dispatch(addInteraction({ 
      id: interactionId, 
      query: searchQuery 
    }));

    try {
      if(isAuthenticated && user && user.email) {
        const endpoint = new URL(`${API_BASE_URL}/api/rag-search`);
        endpoint.searchParams.append("query", searchQuery);
        endpoint.searchParams.append("session_id", sessionId);
        endpoint.searchParams.append("email", user.email);

        const response = await fetch(endpoint.toString(), {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });


        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error("Search request failed");
        }

        const data = await response.json() as SearchResponse;
        
        dispatch(updateInteractionResponse({
          id: interactionId,
          response: {
            agent_response: data.agent_response,
            metadata_content_pairs: data.metadata_content_pairs
          }
        }));

        setSearchQuery("");
      } else {
        navigate("/login");
      }
    } catch (error) {
      dispatch(updateInteractionResponse({
        id: interactionId,
        response: {
          agent_response: "Failed to fetch response.",
          metadata_content_pairs: []
        }
      }));

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to perform search",
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="flex justify-center items-center w-full mx-32">
      <div className="inline-flex bg-background px-10 py-4 gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isSearching && handleSearch()}
          placeholder="Type your message..."
          className="w-[30rem]"
          disabled={isSearching}
        />
        <Button
          type="button"
          onClick={handleSearch}
          size="icon"
          variant="secondary"
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}