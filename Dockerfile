FROM python:3.10-slim

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

# RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -r requirements.txt

COPY . /app

ENV STREAMLIT_DISABLE_ONBOARDING=true

# Set the start script as the default command
CMD ["/app/scripts/start.sh"]
