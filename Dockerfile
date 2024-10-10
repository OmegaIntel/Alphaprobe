FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-mysql-client \
    default-libmysqlclient-dev \
    libssl-dev \
    build-essential \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
# RUN pip install -r /app/requirements.txt

# Copy the rest of the application code
COPY . /app

RUN pip install -e .

WORKDIR /app/api

EXPOSE 8000
