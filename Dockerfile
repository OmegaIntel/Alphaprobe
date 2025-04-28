# Use official Python slim image
FROM python:3.11-slim

# Upgrade pip
RUN pip install --upgrade pip

# Set working dir
WORKDIR /app

# Install system deps
RUN apt-get update && \
    apt-get install -y \
      git \
      pkg-config \
      default-mysql-client \
      default-libmysqlclient-dev \
      libssl-dev \
      build-essential \
      curl unzip \
    --no-install-recommends && \
    curl -fsSL https://ollama.com/install.sh | sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 1. Copy requirements and install them
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 2. Install local-deep-researcher from GitHub
RUN pip install --no-cache-dir \
      git+https://github.com/langchain-ai/local-deep-researcher.git@main#egg=ollama_deep_researcher

# Copy entire project & install it
COPY . .
RUN pip install -e .

# Create logs folder
RUN mkdir -p /app/logs

# Copy entrypoint script
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Work inside your API folder
WORKDIR /app/api

# Expose FastAPI port
EXPOSE 8000

# Launch migrations + app
ENTRYPOINT [ "start.sh" ]
