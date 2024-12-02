import os
# from openbb import obb
from interfaces import Retriever
from llm_models.llm import LLM


llm_wrapper = LLM()


class OpenBBMetricsAPI(Retriever):
    def __init__(self):
        self.setup_api_keys()

    def setup_api_keys(self):
        # Set API keys from environment variables
        obb.user.credentials.fmp_api_key = os.getenv("FMP_API_KEY")
        obb.user.credentials.polygon_api_key = os.getenv("POLYGON_API_KEY")
        obb.user.credentials.tiingo_token = os.getenv("TIINGO_API_KEY")

    def get_key_metrics(self, ticker: str):
        try:
            # Fetch key metrics
            metrics = obb.equity.fundamental.ratios(
                ticker, provider="fmp", limit=10
            ).to_df()
            return metrics.to_json()
        except Exception as e:
            print(f"Error fetching key metrics: {e}")
            return None

    def llm_context(self, user_query: str, company_name: str, user_email: str) -> str:
        """Implements the interface."""
        # TODO: rewrite with proper exception, logging, etc.
        assert company_name
        assert user_email
        print("fetching key metics of the company")
        ticker = llm_wrapper.extract_ticker_from_query(user_query)
        assert ticker, "Error extracting ticker from query."
        key_metrics = self.get_key_metrics(ticker)
        if key_metrics is None:
            out = f"Company {ticker} appears to be delisted and no key metrics data is available."
        else:
            out = f"Key metrics for {ticker} are as follows : {key_metrics} \n\n\n"
        return out
