from firecrawl import FirecrawlApp

def scrape_crunchbase(url):
    app = FirecrawlApp(api_key='fc-f0b5a990147f4ae88364925cd0dee335')
    response = app.scrape_url(url=url, params={'formats': ['markdown']})
    return response

# # Example usage
# url = 'https://www.crunchbase.com/organization/bardeen'
# response = scrape_crunchbase(url)
# print(response)

# # Example usage
# url = 'https://www.owler.com/company/jpmorganchase'
# response = scrape_crunchbase(url)
# print(response)