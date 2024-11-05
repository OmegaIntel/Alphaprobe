import asyncio
import pytest

from web_scraper import find_company_url


class TestFindURL:

    company_name = "10X Engineered Materials"

    def runtest(self, site: str, correct: str):
        result = asyncio.run(find_company_url(self.company_name, site))
        assert correct == result


    def test_owler(self):
        self.runtest('owler.com', 'https://www.owler.com/company/10xem')

    def test_crunchbase(self):
        self.runtest('crunchbase.com', 'https://www.crunchbase.com/organization/10x-engineered-materials')

    def test_pitchbook(self):
        self.runtest('pitchbook.com', 'https://pitchbook.com/profiles/company/264531-70')

    def test_linkedin(self):
        self.runtest('linkedin.com', 'https://www.linkedin.com/company/10xem')

    def test_open_corporates(self):
        self.runtest('opencorporates.com', 'https://sources.opencorporates.com/bots/dk_xbrl_parser/e/c/7/51696536_amNsb3VkczovLzAzL2ZmLzllLzNlL2JjLzkwMjMtNGFkYi04MDA5LTJhZmM2ODNiZDhkZg.pdf')
