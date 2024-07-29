#!/bin/sh

# Start Uvicorn in the background
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload &

# Start Streamlit
python -m streamlit run gui/app.py --server.port 8501 --server.enableCORS false --server.enableXsrfProtection false --server.headless true
