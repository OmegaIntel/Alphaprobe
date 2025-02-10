import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@remix-run/react';
import { API_BASE_URL } from '~/constant';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { ScrollArea } from '~/components/ui/scroll-area';
import { useToast } from '~/hooks/use-toast';
import { Loader2, Plus, ScrollText, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setDealId } from '~/store/slices/dealSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { setData } from '~/store/slices/customReport';

interface Deal {
  id: string;
  name: string;
  start_date: string;
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
  'Last 7 Days': Deal[];
  'Last Month': Deal[];
  Older: Deal[];
}

export function DealsSidebar() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [expandedDeals, setExpandedDeals] = useState<Record<string, boolean>>({});
  const [reports, setReports] = useState<Record<string, Report[]>>({});
  const [reportLoading, setReportLoading] = useState<Record<string, boolean>>({});
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    overview: '',
    industry: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /**
   * Helper to create a new Deal
   */
  const createDeal = async (
    name: string,
    overview: string,
    industry: string
  ) => {
    const payload = {
      name,
      overview: overview || 'No overview provided',
      industry: industry || 'General',
      start_date: new Date().toISOString().split('T')[0],
      due_date: null,
      progress: '0%',
      investment_thesis: 'Initial investment thesis content. Please update.',
    };

    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('authToken='))
      ?.split('=')[1];

    if (!token) {
      throw new Error('You are not authenticated. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}/api/deals/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create deal');
    }

    return await response.json();
  };

  /**
   * Helper to delete a deal
   */
  const deleteDeal = async (dealId: string) => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('authToken='))
      ?.split('=')[1];

    if (!token) {
      throw new Error('You are not authenticated. Please log in.');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/delete_deal?deal_id=${dealId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete deal');
    }
  };

  /**
   * Get a short preview of the report content
   */
  const getReportPreview = (reportData: any) => {
    if (typeof reportData === 'string' && reportData.startsWith('#')) {
      const lines = reportData.split('\n');
      const firstLine = lines[0];
      return firstLine.replace('#', '').trim();
    }
    return reportData?.title || 'Untitled Report';
  };

  useEffect(() => {
    const storedDealId = localStorage.getItem('dealId');
    if (storedDealId) {
      setActiveDealId(storedDealId);
      dispatch(setDealId(storedDealId));
      setExpandedDeals((prev) => ({ ...prev, [storedDealId]: true }));
    }
  }, [dispatch]);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('authToken='))
          ?.split('=')[1];

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/fetch_deals`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data: Deal[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: Expected an array');
        }

        setDeals(data);

        const storedDealId = localStorage.getItem('dealId');
        if (storedDealId && !reports[storedDealId] && !reportLoading[storedDealId]) {
          fetchReports(storedDealId);
        }
      } catch (err) {
        console.error('Error fetching deals:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load deals',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [navigate, toast]);

  /**
   * Fetch the reports for a given deal
   */
  const fetchReports = async (dealId: string) => {
    try {
      setReportLoading((prev) => ({ ...prev, [dealId]: true }));

      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('authToken='))
        ?.split('=')[1];

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/fetch-reports/${dealId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setReports((prev) => ({ ...prev, [dealId]: data.reports }));
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load reports',
      });
    } finally {
      setReportLoading((prev) => ({ ...prev, [dealId]: false }));
    }
  };

  /**
   * Handles Deal creation form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Company name is required',
      });
      return;
    }

    setIsCreatingDeal(true);
    try {
      const dealData = await createDeal(formData.name, formData.overview, formData.industry);

      // Persist the newly created Deal in local storage / Redux
      dispatch(setDealId(dealData.id));
      localStorage.setItem('dealId', dealData.id);

      // Navigate to the new deal's page
      navigate(`/duediligence/${formData.name}`);
      setFormOpen(false);

      // Reset form data
      setFormData({
        name: '',
        overview: '',
        industry: '',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsCreatingDeal(false);
    }
  };

  /**
   * Memoized grouping of deals by date
   */
  const groupedDeals = useMemo(() => {
    const now = new Date();
    const grouped: GroupedDeals = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      'Last Month': [],
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
        grouped['Last 7 Days'].push(deal);
      } else if (diffInDays <= 30) {
        grouped['Last Month'].push(deal);
      } else {
        grouped.Older.push(deal);
      }
    });

    return grouped;
  }, [deals]);

  /**
   * Expand/collapse deals and fetch reports if not already fetched
   */
  const handleDealSelect = (dealId: string, dealName: string) => {
    setActiveDealId(dealId);
    localStorage.setItem('dealId', dealId);
    dispatch(setDealId(dealId));
    setExpandedDeals((prev) => ({ ...prev, [dealId]: !prev[dealId] }));

    // Navigate to the due diligence page for that deal
    navigate(`/duediligence/${dealName}`);

    // Fetch reports if not already loaded
    if (!reports[dealId] && !reportLoading[dealId]) {
      fetchReports(dealId);
    }
  };

  /**
   * On clicking the trash icon, confirm and then delete the deal
   */
  const handleDealDelete = async (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation(); // Prevents triggering deal selection
    if (!window.confirm('Are you sure you want to delete this deal?')) {
      return;
    }
    try {
      await deleteDeal(dealId);
      // Remove from local state
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
      // If currently active, clear local storage
      if (activeDealId === dealId) {
        setActiveDealId(null);
        localStorage.removeItem('dealId');
      }
      toast({
        title: 'Deal Deleted',
        description: 'The deal has been successfully deleted.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    }
  };

  /**
   * Trigger the Deal creation Dialog
   */
  const handleNewDealClick = () => {
    setFormOpen(true);
  };

  return (
    <>
      <Card className="fixed top-14 left-0 bottom-0 w-1/6 h-[93%] border-0 rounded-none">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 rounded-none text-left"
          onClick={handleNewDealClick}
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
                  .filter(([_, groupedDeals]) => groupedDeals.length > 0)
                  .map(([timeRange, groupedDeals]) => (
                    <div key={timeRange} className="space-y-2">
                      <h3 className="text-sm font-medium text-left">{timeRange}</h3>
                      {groupedDeals.map((deal) => (
                        <div key={deal.id}>
                          {/* Main Deal Row */}
                          <div className="flex items-center">
                            <Button
                              variant={activeDealId === deal.id ? 'secondary' : 'ghost'}
                              className="text-sm h-auto py-2 flex-1 justify-start text-left"
                              onClick={() => handleDealSelect(deal.id, deal.name)}
                            >
                              {deal.name}
                            </Button>
                            {/* Trash Icon for deleting the deal */}
                            <Button
                              className="-ml-4 bg-zinc-900 opacity-50 p-2 rounded text-red-500"
                              onClick={(e) => handleDealDelete(e, deal.id)}
                              title="Delete Deal"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* If expanded, show associated reports */}
                          {expandedDeals[deal.id] && (
                            <div className="ml-4 space-y-2 mt-1">
                              {reportLoading[deal.id] ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                              ) : reports[deal.id]?.length > 0 ? (
                                reports[deal.id].map((report) => (
                                  <div
                                    key={report.report_id}
                                    className="text-sm flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
                                    onClick={() => {
                                      dispatch(
                                        setData({
                                          report: report.report_data,
                                          dealId: deal.id,
                                        })
                                      );
                                    }}
                                  >
                                    <ScrollText className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">
                                      {getReportPreview(report.report_data)}
                                    </span>
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

        <div className="m-4">
          <Button
            onClick={() => {
              navigate('/dashboard');
            }}
            className="justify-start"
          >
            Back to DashBoard
          </Button>
        </div>
      </Card>

      {/* Dialog for creating a new deal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter company name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, industry: e.target.value }))
                }
                placeholder="Enter industry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overview">Company Overview</Label>
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, overview: e.target.value }))
                }
                placeholder="Enter company overview"
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isCreatingDeal}>
              {isCreatingDeal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Deal...
                </>
              ) : (
                'Create Deal'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
