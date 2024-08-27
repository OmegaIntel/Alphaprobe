FROM python:3.10-slim

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN mkdir -p /app/data
RUN mkdir -p /app/database

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

ENV STREAMLIT_DISABLE_ONBOARDING=true

# Set the start script as the default command
CMD ["/app/scripts/start.sh"]
