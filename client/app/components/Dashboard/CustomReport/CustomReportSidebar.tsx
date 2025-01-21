import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@remix-run/react";
import { API_BASE_URL } from "~/constant";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from "~/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

interface Deal {
  id: string;
  name: string;
  start_date: string; // ISO format date
  overview: string;
  status: string;
}

interface Report {
  report_id: string;
  deal_id: string;
  report_data: any;
  created_at: string;
  updated_at: string;
}

interface GroupedDeals {
  Today: Deal[];
  Yesterday: Deal[];
  "Last 7 Days": Deal[];
  "Last Month": Deal[];
  Older: Deal[];
}

export function DealsSidebar() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [expandedDeals, setExpandedDeals] = useState<Record<string, boolean>>({});
  const [reports, setReports] = useState<Record<string, Report[]>>({});
  const [reportLoading, setReportLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch deals from the API
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("authToken="))
          ?.split("=")[1];

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/fetch_deals`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data: Deal[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid response format: Expected an array");
        }

        setDeals(data);
      } catch (err) {
        console.error("Error fetching deals:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load deals",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [navigate, toast]);

  // Fetch reports for a specific deal
  const fetchReports = async (dealId: string) => {
    try {
      setReportLoading((prev) => ({ ...prev, [dealId]: true }));

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/fetch-reports/${dealId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setReports((prev) => ({ ...prev, [dealId]: data.reports }));
    } catch (err) {
      console.error("Error fetching reports:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports",
      });
    } finally {
      setReportLoading((prev) => ({ ...prev, [dealId]: false }));
    }
  };

  // Group deals by time ranges
  const groupedDeals = useMemo(() => {
    const now = new Date();
    const grouped: GroupedDeals = {
      Today: [],
      Yesterday: [],
      "Last 7 Days": [],
      "Last Month": [],
      Older: [],
    };

    deals.forEach((deal) => {
      const dealDate = new Date(deal.start_date);
      const diffTime = now.getTime() - dealDate.getTime();
      const diffInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (now.toDateString() === dealDate.toDateString()) {
        grouped.Today.push(deal);
      } else if (diffInDays === 1) {
        grouped.Yesterday.push(deal);
      } else if (diffInDays <= 7) {
        grouped["Last 7 Days"].push(deal);
      } else if (diffInDays <= 30) {
        grouped["Last Month"].push(deal);
      } else {
        grouped.Older.push(deal);
      }
    });

    return grouped;
  }, [deals]);

  // Handle deal selection
  const handleDealSelect = (dealId: string) => {
    setActiveDealId(dealId);
    setExpandedDeals((prev) => ({ ...prev, [dealId]: !prev[dealId] }));

    if (!reports[dealId] && !reportLoading[dealId]) {
      fetchReports(dealId);
    }
  };

  return (
    <Card className="fixed top-14 left-0 bottom-0 w-1/6 h-[93%] border-0 rounded-none">
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 rounded-none"
        onClick={() => setActiveDealId(null)}
      >
        <Plus className="h-4 w-4" />
        New Deal
      </Button>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-14rem)]">
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center text-gray-500">No deals available</div>
            ) : (
              Object.entries(groupedDeals)
                .filter(([_, deals]) => deals.length > 0)
                .map(([timeRange, deals]) => (
                  <div key={timeRange} className="space-y-2">
                    <h3 className="text-sm font-medium">{timeRange}</h3>
                    {deals.map((deal) => (
                      <div key={deal.id} className="space-y-2">
                        <Button
                          variant={activeDealId === deal.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-sm h-auto py-2"
                          onClick={() => handleDealSelect(deal.id)}
                        >
                          {deal.name}
                        </Button>
                        {expandedDeals[deal.id] && (
                          <div className="ml-4 space-y-2">
                            {reportLoading[deal.id] ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : reports[deal.id]?.length > 0 ? (
                              reports[deal.id].map((report) => (
                                <div key={report.report_id} className="text-sm">
                                  {report.report_data?.title || "Untitled Report"}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">
                                No reports available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
