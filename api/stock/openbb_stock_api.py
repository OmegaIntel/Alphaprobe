# openbb_stock.py
import os
# from openbb import obb
from interfaces import Retriever
from llm_models.llm import LLM


llm_wrapper = LLM()


class OpenBBStockAPI(Retriever):
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

    def llm_context(self, user_query: str, company_name: str, user_email: str) -> str:
        """Implements the interface."""
        # TODO: rewrite with proper exception, logging, etc.
        assert company_name
        assert user_email
        ticker = llm_wrapper.extract_ticker_from_query(user_query)
        start_date, end_date = llm_wrapper.extract_dates_from_query(user_query)
        assert ticker and start_date and end_date, "Error extracting ticker or dates from query."
        stock_history = self.get_stock_history(ticker, start_date, end_date)
        if stock_history is None:
            out = f"Company {ticker} appears to be delisted and no historical data is available."
        else:
            out = f"Stock history for {ticker} from {start_date} to {end_date}: {stock_history} \n\n\n"
        return out
