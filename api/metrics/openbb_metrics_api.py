import os
import openbb
from openbb import obb

class OpenBBMetricsAPI:
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

