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


1. Copy credentials from Slack or Notion page into `.env` file in the root folder.


1. Create `.env` file inside the frontend folder and paste the below command into `.env`.
    ```
    REACT_APP_API_BASE_URL=http://127.0.0.1:8000
    ```

1. Start the frontend/backend container.
    ```
    docker compose -f docker-compose-application.yaml up --build -d
    ```

## Access the application

Once all the containers (4 in total) finished building, you can access the frontend and backend locally.

Frontend (React):
```
http://localhost:5173
```

Backend (FastAPI):
```
http://localhost:8000/api/docs
```

## Manual deployment to AWS host

1. Login into the dev server, such as `ssh -i “PEM File path”  ubuntu@3.90.252.178`.

1. Execute the following commands:
    ```
    cd Alphaprobe
    git checkout development
    git pull
    docker compose -f docker-compose-application.yaml down
    nohup docker compose -f docker-compose-application.yaml up --build &
    ```

1. See if there are any errors:
    ```
    tail -f nohup.out
    ```