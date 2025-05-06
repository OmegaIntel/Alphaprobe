#!/usr/bin/env sh
alembic upgrade head

uvicorn app:app \
  --host 0.0.0.0 --port 8000 \
  --reload \
  --loop asyncio