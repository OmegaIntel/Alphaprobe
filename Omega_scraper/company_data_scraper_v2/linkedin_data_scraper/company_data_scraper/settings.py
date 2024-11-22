BOT_NAME = "company_data_scraper"

SPIDER_MODULES = ["company_data_scraper.spiders"]
NEWSPIDER_MODULE = "company_data_scraper.spiders"

USER_AGENT = "Mozilla/5.0 (Linux; Android 11; Redmi Note 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36"

# Don't obey robots.txt since we're scraping
ROBOTSTXT_OBEY = False

# Retry settings in case of failed or blocked requests
RETRY_ENABLED = True

RETRY_TIMES = 10  # Allow more retries
RETRY_HTTP_CODES = [500, 502, 503, 504, 429, 404, 301]  # Adjust based on errors

  # Handle server errors and rate limiting

# Enable AutoThrottle to avoid rate-limiting/blocking
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 3  # Initial delay between requests (seconds)
AUTOTHROTTLE_MAX_DELAY = 60  # Max delay if requests start getting throttled
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0  # Average number of requests to send in parallel to the server
AUTOTHROTTLE_DEBUG = False  # Disable detailed AutoThrottle logging

# Concurrent requests (adjust based on LinkedIn's rate-limiting)
CONCURRENT_REQUESTS = 16  # Default is 16, adjust if needed
DOWNLOAD_DELAY = 10  # Delay in seconds between requests to avoid being blocked

# Depth limit to ensure all URLs are crawled
DEPTH_LIMIT = None  # No depth limit, scrape all pages

# HTTP cache (optional, useful for debugging)
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 86400  # Cache for 1 day
HTTPCACHE_DIR = "httpcache"
HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504, 429]
HTTPCACHE_STORAGE = "scrapy.extensions.httpcache.FilesystemCacheStorage"

# Timeout for requests
DOWNLOAD_TIMEOUT = 15  # Set timeout for requests (in seconds)

# Twisted reactor (for async request handling)
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"

# Feed export encoding
FEED_EXPORT_ENCODING = "utf-8"
