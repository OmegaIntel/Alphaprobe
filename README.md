# Alphaprobe


## Setup Instructions For Backend:


Follow these steps to set up and run the backend:

### 1. Clone the repository
```
git clone https://github.com/chat-omega/Alphaprobe.git
```
### 2. Set up a virtual environment
```
python -m venv venv
```
### 3. Activate the virtual environment
On macOS/Linux:
```
source venv/bin/activate
```
On Windows:
```
venv\Scripts\activate
```
### 4. Install the required dependencies
```
pip install -r requirements.txt
```
### 5. Apply database migrations
```
cd api/
alembic upgrade head
```
### 6. Run Weaviate Docker Container:
```
sudo docker-compose -f docker-compose-weaviate.yaml up
```
### 7. Run the backend server
```
cd api/
uvicorn app:app --reload
```

## Setup Instructions For Frontend: 

Follow these steps to set-up the Frontend:

### 1. Create .env file:

First of all create a .env inside the frontend folder and paste the below command in .env
REACT_APP_API_BASE_URL = http://127.0.0.1:8000

### 2. Start the Frontend:
Run the below commands to run the Frontend:
```
cd frontend/
npm install
npm start

```

## Access the application

Once everything is set up, you can access the frontend and backend locally.
Frontend (React):
```
 http://localhost:3000

```

Backend (FastAPI):
```
http://localhost:8000/api

```