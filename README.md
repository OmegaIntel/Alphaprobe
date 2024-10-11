# Alphaprobe


## Setup Instructions:

1. Clone the repository
    ```
    git clone https://github.com/chat-omega/Alphaprobe.git
    ```

1. Check out the appropriate branch
    ```
    git checkout development
    ```

1. Run Weaviate Docker Container (you may need to use `sudo`):
    ```
    docker compose -f docker-compose-weaviate.yaml up --build
    ```

1. Copy credentials from Slack or Notion page into `.env` file in the root folder.


1. Create `.env` file inside the frontend folder and paste the below command into `.env`.
    ```
    REACT_APP_API_BASE_URL=http://127.0.0.1:8000
    ```

1. Start the frontend/backend container.
    ```
    docker compose -f docker-compose-application.yaml up --build
    ```

## Access the application

Once all the containers (4 in total) finished building, you can access the frontend and backend locally.

Frontend (React):
```
http://localhost:3000
```

Backend (FastAPI):
```
http://localhost:8000/api/docs
```
