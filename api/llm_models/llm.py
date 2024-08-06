# llm.py
import os
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI

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
            template="Determine if the following query is about real-world data and should better be searched on internet:\n\n{query}\nRespond with 'yes' or 'no'."
        )
        self.stock_query_prompt_template = PromptTemplate(
            input_variables=["query"],
            template="Determine if the following query is about stock market history:\n\n{query}\nRespond with 'yes' or 'no'."
        )
        self.date_extraction_prompt_template = PromptTemplate(
            input_variables=["query"],
            template="Extract the start date and end date for stock history from the following query:\n\n{query}\nRespond in the format 'start_date: YYYY-MM-DD, end_date: YYYY-MM-DD'."
        )
        self.ticker_extraction_prompt_template = PromptTemplate(
            input_variables=["query"],
            template="Extract the company ticker symbol from the following query:\n\n{query}\nRespond in the format 'ticker: SYMBOL'."
        )

        # Create LangChain chains for these tasks
        self.summarization_chain = LLMChain(llm=self.openai_client, prompt=self.summarization_prompt_template)
        self.response_chain = LLMChain(llm=self.openai_client, prompt=self.response_prompt_template)
        self.real_world_query_chain = LLMChain(llm=self.openai_client, prompt=self.real_world_query_prompt_template)
        self.stock_query_chain = LLMChain(llm=self.openai_client, prompt=self.stock_query_prompt_template)
        self.date_extraction_chain = LLMChain(llm=self.openai_client, prompt=self.date_extraction_prompt_template)
        self.ticker_extraction_chain = LLMChain(llm=self.openai_client, prompt=self.ticker_extraction_prompt_template)

    def chunk_content(self, content: str, max_tokens: int = 2048) -> list:
        tokens = content.split()
        chunks = []
        current_chunk = []

        for token in tokens:
            if len(current_chunk) + len(token) + 1 > max_tokens:
                chunks.append(' '.join(current_chunk))
                current_chunk = [token]
            else:
                current_chunk.append(token)

        if current_chunk:
            chunks.append(' '.join(current_chunk))

        return chunks

    def summarize_content(self, content: str) -> str:
        try:
            chunks = self.chunk_content(content)
            summaries = []
            for chunk in chunks:
                summary = self.summarization_chain.run({"content": chunk}).strip()
                summaries.append(summary)
            return ' '.join(summaries)
        except Exception as e:
            print(f"Error summarizing content: {e}")
            return "An error occurred while summarizing the content."

    def generate_response(self, user_message: str, context: str) -> str:
        try:
            response = self.response_chain.run({"user_message": user_message, "context": context})
            return response.strip()
        except Exception as e:
            print(f"Error generating response: {e}")
            return "An error occurred while generating the response."

    def is_real_world_query(self, query: str) -> bool:
        try:
            response = self.real_world_query_chain.run({"query": query}).strip().lower()
            return response == "yes"
        except Exception as e:
            print(f"Error determining if query is real-world: {e}")
            return False

    def is_stock_history_query(self, query: str) -> bool:
        try:
            response = self.stock_query_chain.run({"query": query}).strip().lower()
            return response == "yes"
        except Exception as e:
            print(f"Error determining if query is about stock history: {e}")
            return False

    def extract_dates_from_query(self, query: str) -> tuple:
        try:
            response = self.date_extraction_chain.run({"query": query}).strip()
            dates = response.split(',')
            start_date = dates[0].split(': ')[1]
            end_date = dates[1].split(': ')[1]
            return start_date, end_date
        except Exception as e:
            print(f"Error extracting dates from query: {e}")
            return None, None

    def extract_ticker_from_query(self, query: str) -> str:
        try:
            response = self.ticker_extraction_chain.run({"query": query}).strip()
            ticker = response.split(': ')[1]
            return ticker
        except Exception as e:
            print(f"Error extracting ticker from query: {e}")
            return None
