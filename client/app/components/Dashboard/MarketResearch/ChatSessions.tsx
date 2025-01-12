import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@remix-run/react";
import { useDispatch } from "react-redux";
import {
  addInteraction,
  updateInteractionResponse,
  resetInteractions,
} from "~/store/slices/chatSlice";
import { v4 as uuidv4 } from "uuid";
import { API_BASE_URL } from "~/constant";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from "~/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "~/services/AuthContext";

interface Session {
  session_id: string;
  first_query: string;
  last_access_time: string;
}

interface Response {
  agent_response: string;
  metadata_content_pairs: any;
}

interface SessionHistory {
  query: string;
  response: Response;
}

interface SessionResponse {
  history: SessionHistory[];
}

interface GroupedSessions {
  Today: Session[];
  Yesterday: Session[];
  "Last 7 Days": Session[];
  "Last Month": Session[];
  Older: Session[];
}

export function ChatSession({ 
  onSessionSelect, 
  onFirstQueryMade 
}: { 
  onSessionSelect?: (data: SessionResponse) => void;
  onFirstQueryMade?: () => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedSessionLoading, setSelectedSessionLoading] = useState(false);
  const [hasFirstQueryBeenMade, setHasFirstQueryBeenMade] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.email) return;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const email = user?.email;
        const response = await fetch(`${API_BASE_URL}/api/user-sessions?email=${encodeURIComponent(email)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        const filteredSessions = data.sessions.filter((session: Session) => session.first_query);
        setSessions(filteredSessions);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sessions",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [isAuthenticated, isLoading, user, toast]);

  const handleStartNewConversation = async () => {
    try {
      dispatch(resetInteractions());
      setActiveSessionId(null);
      localStorage.removeItem("rag_session_id");

      const payload = { email: user?.email };
      const response = await fetch(`${API_BASE_URL}/api/new-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const { session_id } = await response.json();
      localStorage.setItem("rag_session_id", session_id);
      setActiveSessionId(session_id);

      if (onFirstQueryMade) {
        setHasFirstQueryBeenMade(false);
        onFirstQueryMade();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create new session",
      });
    }
  };

  const handleSessionHistory = (entry: SessionHistory) => {
    const interactionId = uuidv4();

    dispatch(
      addInteraction({
        id: interactionId,
        query: entry.query,
      })
    );

    dispatch(
      updateInteractionResponse({
        id: interactionId,
        response: entry.response,
      })
    );
  };

  const handleSessionSelect = async (sessionId: string) => {
    dispatch(resetInteractions());
    setSelectedSessionLoading(true);

    try {
      const url = new URL(`${API_BASE_URL}/api/session/set-active`);
      url.searchParams.append("session_id", sessionId);
      const payload = { email: user?.email };

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data: SessionResponse = await response.json();

      setActiveSessionId(sessionId);
      localStorage.setItem("rag_session_id", sessionId);

      if (onSessionSelect) {
        onSessionSelect(data);
      }

      const sessionHistory = data.history || [];
      sessionHistory.forEach(handleSessionHistory);

      if (!hasFirstQueryBeenMade) {
        setHasFirstQueryBeenMade(true);
        if (onFirstQueryMade) {
          onFirstQueryMade();
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set active session",
      });
    } finally {
      setSelectedSessionLoading(false);
    }
  };

  const groupedSessions = useMemo(() => {
    const now = new Date();
    const grouped: GroupedSessions = {
      Today: [],
      Yesterday: [],
      "Last 7 Days": [],
      "Last Month": [],
      Older: [],
    };

    sessions.forEach((session) => {
      const sessionDate = new Date(session.last_access_time);
      const diffTime = now.getTime() - sessionDate.getTime();
      const diffInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (now.toDateString() === sessionDate.toDateString()) {
        grouped.Today.push(session);
      } else if (diffInDays === 1) {
        grouped.Yesterday.push(session);
      } else if (diffInDays <= 7) {
        grouped["Last 7 Days"].push(session);
      } else if (diffInDays <= 30) {
        grouped["Last Month"].push(session);
      } else {
        grouped.Older.push(session);
      }
    });

    return grouped;
  }, [sessions]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <Card className="fixed top-14 left-0 bottom-0 w-1/6 h-[93%] border-0 rounded-none">
      {/* <CardHeader className="border-b">
        <h2 className="text-lg font-bold">Chat Sessions</h2>
      </CardHeader> */}

      <Button
        variant="ghost"
        className="w-full justify-start gap-2 rounded-none"
        onClick={handleStartNewConversation}
      >
        <Plus className="h-4 w-4" />
        New Conversation
      </Button>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-14rem)]">
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              Object.entries(groupedSessions)
                .filter(([_, sessions]) => sessions.length > 0)
                .map(([timeRange, sessions]) => (
                  <div key={timeRange} className="space-y-2">
                    <h3 className="text-sm font-medium">{timeRange}</h3>
                    {sessions.map((session: Session) => (
                      <Button
                        key={session.session_id}
                        variant={activeSessionId === session.session_id ? "secondary" : "ghost"}
                        className="w-full justify-start text-sm h-auto py-2"
                        onClick={() => handleSessionSelect(session.session_id)}
                      >
                        {session.first_query}
                      </Button>
                    ))}
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
        {/* <Button 
          variant="destructive" 
          className="w-full gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button> */}
      </div>
    </Card>
  );
}