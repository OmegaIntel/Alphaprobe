import asyncio
import pytest

from url_finder import find_company_url


class TestFindURL:

    company_name = "Microsoft"

    def runtest(self, site: str, correct: str):
        result = asyncio.run(find_company_url(self.company_name, site))
        assert correct == result


    def test_owler(self):
        self.runtest('owler.com', 'https://www.owler.com/company/microsoft')

    def test_crunchbase(self):
        self.runtest('crunchbase.com', 'https://www.crunchbase.com/organization/microsoft')

    def test_pitchbook(self):
        self.runtest('pitchbook.com', 'https://pitchbook.com/profiles/company/11026-45')

    def test_linkedin(self):
        self.runtest('linkedin.com', 'https://www.linkedin.com/company/microsoft')


