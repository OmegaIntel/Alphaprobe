FROM python:3.14.0a1-slim

WORKDIR /app

# Copy requirements and install Python dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

RUN playwright install
RUN playwright install-deps

# Copy the rest of the application code
COPY . /app

RUN pip install -e .

WORKDIR /app/company_data_scraper

# EXPOSE 8401
EXPOSE 8008
