import json
import logging  # Import logging for detailed output
import scrapy
from typing import Any, Iterable
import re

# Set up logging
logging.basicConfig(level=logging.INFO)  # Change to DEBUG for even more detail

class CompanyProfileScraperSpider(scrapy.Spider):
    name = 'company_profile_scraper'
    
    def __init__(self, urls=None, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Load company URLs from the provided argument
        self.company_pages = json.loads(urls) if urls else []
        
        if not self.company_pages:
            logging.info("No company URLs found. Exiting spider.")
            raise ValueError("No URLs to scrape.")

        logging.info(f"Starting scraper with URLs: {self.company_pages}")

    def start_requests(self):
        company_index_tracker = 0
        first_url = self.company_pages[company_index_tracker]
        yield scrapy.Request(url=first_url, callback=self.parse_response,
                             meta={'company_index_tracker': company_index_tracker})

    def parse_response(self, response):
        company_index_tracker = response.meta['company_index_tracker']
        print('********')
        print(f'Scraping page: {str(company_index_tracker + 1)} of {str(len(self.company_pages))}')
        print('********')

        company_item = {}

        try:
            company_item['company_name'] = response.css('.top-card-layout__entity-info h1::text').get(default='N/A').strip()
        except Exception as e:
            logging.warning(f"Failed to fetch company name: {e}")
            company_item['company_name'] = 'N/A'

        try:
            followers_text = response.xpath('//h3[contains(@class, "top-card-layout__first-subline")]/span/following-sibling::text()').get()
            company_item['linkedin_followers_count'] = int(followers_text.split()[0].replace(',', '').strip()) if followers_text else 'N/A'
        except Exception as e:
            logging.warning(f"Failed to fetch LinkedIn followers count: {e}")
            company_item['linkedin_followers_count'] = 'N/A'

        try:
            company_item['company_logo_url'] = response.css('div.top-card-layout__entity-image-container img::attr(data-delayed-url)').get(default='N/A')
        except Exception as e:
            logging.warning(f"Failed to fetch company logo URL: {e}")
            company_item['company_logo_url'] = 'N/A'

        try:
            company_item['about_us'] = response.css('.core-section-container__content p::text').get(default='N/A').strip()
        except Exception as e:
            logging.warning(f"Failed to fetch About Us: {e}")
            company_item['about_us'] = 'N/A'

        try:
            followers_num_match = re.findall(r'\d{1,3}(?:,\d{3})*', response.css('a.face-pile__cta::text').get(default='N/A').strip())
            company_item['num_of_employees'] = int(followers_num_match[0].replace(',', '')) if followers_num_match else 'N/A'
        except Exception as e:
            logging.warning(f"Failed to fetch number of employees: {e}")
            company_item['num_of_employees'] = 'N/A'

        try:
            company_details = response.css('.core-section-container__content .mb-2')
            company_item['website'] = company_details[0].css('a::text').get(default='N/A').strip() if company_details else 'N/A'
            company_item['industry'] = company_details[1].css('.text-md::text').getall()[1].strip() if len(company_details) > 1 else 'N/A'
            company_item['company_size_approx'] = company_details[2].css('.text-md::text').getall()[1].strip().split()[0] if len(company_details) > 2 else 'N/A'
            company_item['headquarters'] = company_details[3].css('.text-md::text').getall()[1].strip() if len(company_details) > 3 else 'N/A'
            company_item['type'] = company_details[4].css('.text-md::text').getall()[1].strip() if len(company_details) > 4 else 'N/A'
            
            unsure_parameter = company_details[5].css('.text-md::text').getall() if len(company_details) > 5 else []
            unsure_parameter_key = unsure_parameter[0].lower().strip() if unsure_parameter else 'N/A'
            company_item[unsure_parameter_key] = unsure_parameter[1].strip() if len(unsure_parameter) > 1 else 'N/A'

            if unsure_parameter_key == 'founded':
                company_specialties = company_details[6].css('.text-md::text').getall() if len(company_details) > 6 else []
                company_item['specialties'] = company_specialties[1].strip() if company_specialties else 'N/A'
            else:
                company_item['founded'] = 'N/A'
                company_item['specialties'] = 'N/A'

            company_item['funding'] = response.css('p.text-display-lg::text').get(default='N/A').strip()
            funding_total_rounds_text = response.xpath('//section[contains(@class, "aside-section-container")]/div/a[contains(@class, "link-styled")]//span[contains(@class, "before:middot")]/text()').get()
            company_item['funding_total_rounds'] = int(funding_total_rounds_text.strip().split()[0]) if funding_total_rounds_text else 'N/A'
            company_item['funding_option'] = response.xpath('//section[contains(@class, "aside-section-container")]/div//div[contains(@class, "my-2")]/a[contains(@class, "link-styled")]/text()').get(default='N/A').strip()
            company_item['last_funding_round'] = response.xpath('//section[contains(@class, "aside-section-container")]/div//div[contains(@class, "my-2")]/a[contains(@class, "link-styled")]//time[contains(@class, "before:middot")]/text()').get(default='N/A').strip()

        except IndexError as e:
            logging.warning("Missing some company details: {}".format(e))

        yield company_item

        company_index_tracker += 1

        if company_index_tracker < len(self.company_pages):
            next_url = self.company_pages[company_index_tracker]
            yield scrapy.Request(url=next_url, callback=self.parse_response,
                                 meta={'company_index_tracker': company_index_tracker})
