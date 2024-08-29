import os
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableSequence, RunnableLambda

class LLM:
    def __init__(self):
        self.model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

        # Initialize the ChatOpenAI client
        self.openai_client = ChatOpenAI(model_name=self.model_name, openai_api_key=self.openai_api_key)

        # Define prompt templates
        self.summarization_prompt_template = PromptTemplate(
            input_variables=["content"],
            template="Summarize the following content:\n\n{content}"
        )
        self.response_prompt_template = PromptTemplate(
            input_variables=["user_message", "context"],
            template="User message: {user_message}\nContext: {context}\nProvide a relevant answer based on the context."
        )
        self.real_world_query_prompt_template = PromptTemplate(
            input_variables=["query"],
            template="Determine if the following query is about real-time or latest data and should better be searched on the internet:\n\n{query}\nRespond with 'yes' or 'no'."
        )
        self.stock_query_prompt_template = PromptTemplate(
            input_variables=["query"],
            template="Determine if the following query is about stock market history:\n\n{query}\nRespond with 'yes' or 'no'."
        )

        self.is_key_metrics_query_prompt_template = PromptTemplate(
            input_variables=["query"],
            template="Determine if the following query is about companies fundamental metrics which may include balance, balance_growth, cash, cash_growth, dividends, employee_count, filings, historical_attributes, historical_eps, historical_splits, income, income_growth, latest_attributes, management, management_compensation, metrics, multiples, ratios, reported_financials, revenue_per_geography, revenue_per_segment, search_attributes, trailing_dividend_yield or transcript etc:\n\n{query}\nRespond with 'yes' or 'no'."
        )
        self.date_extraction_prompt_template = PromptTemplate(
            input_variables=["query"],
            template="Extract the start date and end date for stock history from the following query:\n\n{query}\nRespond in the format 'start_date: YYYY-MM-DD, end_date: YYYY-MM-DD'."
        )
        self.ticker_extraction_prompt_template = PromptTemplate(
            input_variables=["query"],
            template="Extract the company ticker symbol from the following query:\n\n{query}\nRespond in the format 'ticker: SYMBOL'."
        )

        self.session_name_summarization_prompt_template = PromptTemplate(
            input_variables=["content"],
            template="Summarize the following content in 3-4 words:\n\n{content}"
        )

        self.enhance_user_message_chain_prompt_template = PromptTemplate(
            input_variables=["content"],
            template="rewrite the user message just replace the generic nounce and pronounce with company specific words repond only the user message:\n\n{content}"
        )

        # Create LangChain chains for these tasks
        self.summarization_chain = RunnableSequence(
            RunnableLambda(lambda x: self.summarization_prompt_template.format(**x)),
            self.openai_client
        )
        self.response_chain = RunnableSequence(
            RunnableLambda(lambda x: self.response_prompt_template.format(**x)),
            self.openai_client
        )
        self.real_world_query_chain = RunnableSequence(
            RunnableLambda(lambda x: self.real_world_query_prompt_template.format(**x)),
            self.openai_client
        )
        self.stock_query_chain = RunnableSequence(
            RunnableLambda(lambda x: self.stock_query_prompt_template.format(**x)),
            self.openai_client
        )

        self.is_key_metrics_query_chain = RunnableSequence(
            RunnableLambda(lambda x: self.is_key_metrics_query_prompt_template.format(**x)),
            self.openai_client
        )

        self.date_extraction_chain = RunnableSequence(
            RunnableLambda(lambda x: self.date_extraction_prompt_template.format(**x)),
            self.openai_client
        )
        self.ticker_extraction_chain = RunnableSequence(
            RunnableLambda(lambda x: self.ticker_extraction_prompt_template.format(**x)),
            self.openai_client
        )

        self.session_name_summarization_chain = RunnableSequence(
            RunnableLambda(lambda x: self.session_name_summarization_prompt_template.format(**x)),
            self.openai_client
        )

        self.enhance_user_message_chain = RunnableSequence(
            RunnableLambda(lambda x: self.enhance_user_message_chain_prompt_template.format(**x)),
            self.openai_client
        )

    def summarize_content(self, content: str) -> str:
        try:
            summary_message = self.summarization_chain.invoke({"content": content})
            summary_text = summary_message.content.strip()
            return summary_text
        except Exception as e:
            print(f"Error summarizing content: {e}")
            return "An error occurred while summarizing the content."

    def generate_response(self, user_message: str, context: str) -> str:
        try:
            response_message = self.response_chain.invoke({"user_message": user_message, "context": context})
            return response_message.content.strip()
        except Exception as e:
            print(f"Error generating response: {e}")
            return "An error occurred while generating the response."

    def is_real_world_query(self, query: str) -> bool:
        try:
            response_message = self.real_world_query_chain.invoke({"query": query})
            return response_message.content.strip().lower() == "yes"
        except Exception as e:
            print(f"Error determining if query is real-world: {e}")
            return False

    def is_stock_history_query(self, query: str) -> bool:
        try:
            response_message = self.stock_query_chain.invoke({"query": query})
            return response_message.content.strip().lower() == "yes"
        except Exception as e:
            print(f"Error determining if query is about stock history: {e}")
            return False
    
    def is_key_metrics_query(self, query: str) -> bool:
        try:
            response_message = self.is_key_metrics_query_chain.invoke({"query": query})
            return response_message.content.strip().lower() == "yes"
        except Exception as e:
            print(f"Error determining if query is about stock history: {e}")
            return False

    def extract_dates_from_query(self, query: str) -> tuple:
        try:
            response_message = self.date_extraction_chain.invoke({"query": query})
            response = response_message.content.strip()
            dates = response.split(',')
            start_date = dates[0].split(': ')[1]
            end_date = dates[1].split(': ')[1]
            return start_date, end_date
        except Exception as e:
            print(f"Error extracting dates from query: {e}")
            return None, None

    def extract_ticker_from_query(self, query: str) -> str:
        try:
            response_message = self.ticker_extraction_chain.invoke({"query": query})
            ticker = response_message.content.strip().split(': ')[1]
            return ticker
        except Exception as e:
            print(f"Error extracting ticker from query: {e}")
            return None
        
    def generate_summary_name(self, user_message: str, ai_message: str) -> str:
        try:
            summary_message = self.session_name_summarization_chain.invoke({"content": f"{user_message} {ai_message}"})
            return summary_message.content.strip()
        except Exception as e:
            print(f"Error generating session name: {e}")
            return "Session"
        
    def enhance_user_message(self, company_context: str, past_messages_context: str, user_message: str) -> str:
        try:
            summary_message = self.enhance_user_message_chain.invoke({"content":  f"company_context:{company_context}\n\n\n past_messages_context:{past_messages_context}\n\n\n user_message:{user_message}"})
            return summary_message.content.strip()
        except Exception as e:
            print(f"Error generating session name: {e}")
            return "Session"
