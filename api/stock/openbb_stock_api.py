# openbb_stock.py
import os
import openbb
from openbb import obb

class OpenBBStockAPI:
    def __init__(self):
        self.setup_api_keys()

    def setup_api_keys(self):
        # Set API keys from environment variables
        obb.user.credentials.fmp_api_key = os.getenv("FMP_API_KEY")
        obb.user.credentials.polygon_api_key = os.getenv("POLYGON_API_KEY")
        # obb.user.credentials.alpha_vantage_api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        obb.user.credentials.tiingo_token = os.getenv("TIINGO_API_KEY")

    def is_company_delisted(self, ticker: str) -> bool:
        try:
            # Attempt to get a quote for the ticker to check if it's delisted
            quote = obb.equity.quote(ticker)
            return quote.empty
        except Exception as e:
            print(f"Error checking if company is delisted: {e}")
            return True

    def get_stock_history(self, ticker: str, start_date: str, end_date: str):
        if self.is_company_delisted(ticker):
            print(f"Company {ticker} is delisted")
            return None
        try:
            # Fetch historical stock data
            stock_data = obb.equity.price.historical(
                symbol=ticker, 
                start_date=start_date, 
                end_date=end_date
            ).to_df()
            return stock_data
        except Exception as e:
            print(f"Error fetching stock history: {e}")
            return None
