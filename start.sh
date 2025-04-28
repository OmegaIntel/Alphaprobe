#!/usr/bin/env sh

# Wait until Ollama is responding
until ollama list >/dev/null 2>&1; do
  echo "Waiting for Ollama to be ready…"
  sleep 1
done

# 2) Pull the model if it’s not already present
if ! ollama list | grep -q "deepseek-r1"; then
  echo "Pulling deepseek-r1:8b model…"
  ollama pull deepseek-r1:8b
fi

#Apply DB migrations
alembic upgrade head

#Launch FastAPI server
uvicorn app:app \
  --host 0.0.0.0 --port 8000 \
  --reload \
  --loop asyncio
