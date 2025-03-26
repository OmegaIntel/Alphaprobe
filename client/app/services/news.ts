
import { API_BASE_URL } from "~/constant";
import { toast } from "~/hooks/use-toast";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

export const fetchNewsFeed = async (): Promise<NewsItem[]> => {
  try {
   
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL is not defined.");
    }

    const response = await fetch(`${API_BASE_URL}/api/rss-feed`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // ...(Token && { Authorization: `Bearer ${Token}` }), // Add token if available
      },
    });

    if (!response.ok) {
    //   if (response.status === 401 || response.status === 403) {
    //     if (typeof window !== "undefined") {
    //       localStorage.removeItem("token"); // Remove token on client
    //       window.location.href = "/login"; // Redirect to login
    //     }
    //   }
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data: NewsItem[] = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching news data:", error);
    toast({
      variant: "destructive",
      title: "Error fetching news",
      description: error.message || "Failed to fetch news feed.",
    });
    throw error;
  }
};
