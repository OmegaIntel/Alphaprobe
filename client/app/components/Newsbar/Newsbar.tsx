import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import { fetchNewsFeed } from '~/services/news'

interface NewsItem {
  title: string
  link: string
  pubDate: string
}

const NewsBar: React.FC = () => {
  const [newsData, setNewsData] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState<boolean>(false)

  useEffect(() => {
    // Only run on client
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const fetchNewsData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchNewsFeed()
        setNewsData(response)
      } catch (err) {
        console.error('Error fetching news data:', err)
        setError(
          'There was an error fetching the news. Please try again later.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchNewsData()
  }, [isClient])

  if (!isClient) {
    // Return null during SSR
    return null
  }

  return (
    <div className=" p-4 mx-20">
      <h2 className="scroll-m-20 text-stone-950  text-2xl font-semibold tracking-tight">
        Industry News
      </h2>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          {/* Loader2 from lucide-react, with spin animation and a visible color */}
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : error ? (
        <div className="my-4">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="mt-4 max-h-52 space-y-2 overflow-y-auto">
          {newsData.map((item, index) => (
            <div key={index} className="space-y-1 scrollbar-thin">
              <div className="flex items-center justify-between gap-4">
                <a
                  className="font-medium text-primary hover:underline"
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.title}
                </a>
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  {item.pubDate}
                </span>
              </div>
              <hr className="border-muted" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NewsBar
