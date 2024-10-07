
# Alphaprobe

This project provides a FastAPI-based service that allows users to upload PDF files for a specific deal/transaction and query the uploaded document for specific info using Weaviate as a vector store.

## Table of Contents

1. Features
2. Setup Instructions
3. Environment Variables
4. Project Structure
5. API Endpoints
6. Code Descriptions

## Features

- Upload PDF files associated with a deal/transaction.
- Store the file content in a Weaviate database.
- Query financial documents using LLM via LangChain.
- Automatically create a schema per deal in the Weaviate database.

## Local Development Setup Instructions

```sh
# enable for caching Python packages
export DOCKER_BUILDKIT=1
```

### Prerequisites

- Docker
- Docker Compose
- Python 3.10.14 or higher (only for docker-less development)

### Steps

1. **Clone the repository**

   ```sh
   git clone https://github.com/chat-omega/Alphaprobe
   cd Alphaprobe
   ```

2. **Set up environment variables**

Create a `.env` file in the project root by copying the production `.env`.

Create a `.env` in `frontend` with the following line:
`REACT_APP_API_BASE_URL = http://127.0.0.1:3000`

Note: in AWS this line is not needed or can be copied from `frontend/.env`.

1. **Build and start the Docker containers**

```sh
# wait until the first one finishes
docker compose -f docker-compose-weaviate.yaml up --build
docker compose -f docker-compose-application.yaml up --build
```

1. **Access the FastAPI documentation**

Open your browser and go to http://localhost:8000/api/docs to view and test the API endpoints.

## Environment Variables


## Project Structure (DATED)

```
.
├── Dockerfile
├── api
│   ├── __init__.py
│   ├── api.py
│   ├── app.py
│   ├── db_models
│   │   ├── __init__.py
│   │   └── weaviate_db.py
│   ├── llm_models
│   │   ├── __init__.py
│   │   └── llm.py
│   └── models
│       ├── __init__.py
│       ├── chat
│       │   ├── __init__.py
│       │   ├── chat_request.py
│       │   └── chat_response.py
│       └── files
│           ├── __init__.py
│           └── upload_response.py
├── docker-compose.yaml
├── extractor
│   ├── __init__.py
│   ├── merge_text.py
│   ├── pdf_to_text.py
│   └── word_counter.py
└── requirements.txt
```

## API Endpoints (DATED AS WELL)

### `POST /chat`

- **Description**: Echoes back the user's message.
- **Request Body**:
  ```json
  {
    "message": "string"
  }
  ```
- **Response**:
  ```json
  {
    "response": "Echo: string"
  }
  ```

### `POST /upload`

- **Description**: Uploads a text file for a company and stores the content in Weaviate. Summarizes the content if it is a financial document.
- **Request Form Data**:
  - `company`: The name of the company.
  - `file_type`: The type of file (`descriptive` or `financial`).
  - `file`: The file to upload.
- **Response**:
  ```json
  {
    "company": "string",
    "file_name": "string",
    "file_type": "string",
    "detail": "File uploaded successfully"
  }
  ```

## Code Descriptions

### `api/api.py`

- **Purpose**: Defines the FastAPI router and the API endpoints.
- **Key Endpoints**:
  - `/chat` endpoint: Handles chat requests.
  - `/upload` endpoint: Handles file uploads and invokes summarization for financial documents.

### `api/app.py`

- **Purpose**: Initializes the FastAPI application and includes the router from `api.py`.

### `api/db_models/weaviate_db.py`

- **Purpose**: Encapsulates operations related to the Weaviate database.
- **Key Methods**:
  - `create_schema(company)`: Creates a schema for storing documents related to the specified company.
  - `upload_content(class_name, content, file_path)`: Uploads content to Weaviate.

### `api/llm_models/llm.py`

- **Purpose**: Provides a wrapper for summarization using LLM with LangChain.
- **Key Methods**:
  - `summarize_content(content)`: Summarizes the given content using the specified LLM.

### `api/models/chat/chat_request.py`

- **Purpose**: Defines the request model for chat messages.
- **Key Components**:
  - `ChatRequest`: Pydantic model with a single field `message`.

### `api/models/chat/chat_response.py`

- **Purpose**: Defines the response model for chat messages.
- **Key Components**:
  - `ChatResponse`: Pydantic model with a single field `response`.

### `api/models/files/upload_response.py`

- **Purpose**: Defines the response model for file uploads.
- **Key Components**:
  - `UploadResponse`: Pydantic model with fields `company`, `file_name`, `file_type`, and `detail`.

### `extractor/merge_text.py`

- **Purpose**: Contains logic for merging text content from different sources.

### `extractor/pdf_to_text.py`

- **Purpose**: Contains logic for extracting text content from PDF files.

### `extractor/word_counter.py`

- **Purpose**: Contains logic for counting words in text content.

---

This README provides an overview of the project setup and descriptions of the key components. Adjust the `https://github.com/chat-omega/Alphaprobe` and `Alphaprobe` placeholders with the actual repository URL and directory name, respectively.
