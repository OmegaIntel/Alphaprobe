# Use official Python slim image
FROM python:3.13.5-slim

# Upgrade pip
RUN pip install --upgrade pip

# Set working dir
WORKDIR /app

# Install system deps
RUN apt-get update && \
    apt-get install -y \
      pkg-config \
      default-mysql-client \
      default-libmysqlclient-dev \
      libssl-dev \
      build-essential \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy & install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

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