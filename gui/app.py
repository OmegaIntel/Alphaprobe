import streamlit as st
import requests
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get the API endpoints from the environment variables
CHAT_API_URL = os.getenv("CHAT_API_URL")
UPLOAD_API_URL = os.getenv("UPLOAD_API_URL")

# Title of the Streamlit app
st.title("Company Interaction Interface")

# Tabs for chat and upload functionalities
tab1, tab2 = st.tabs(["Chat", "Upload"])

# Chat interface
with tab1:
    st.header("Chat with API")
    company_name_chat = st.text_input("Company Name (Chat)", key="company_name_chat")
    message = st.text_area("Message")
    
    if st.button("Send Message"):
        if company_name_chat and message:
            payload = {
                "company": company_name_chat,
                "message": message
            }
            headers = {
                "Content-Type": "application/json"
            }
            
            response = requests.post(CHAT_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                response_data = response.json()
                formatted_response = response_data.get("response", "No response received")
                st.markdown(f"**Response:**\n\n{formatted_response}")
            else:
                st.error("Failed to get a response from the API.")
        else:
            st.warning("Please enter both the company name and the message.")

# File upload interface
with tab2:
    st.header("Upload a File to API")
    company_name_upload = st.text_input("Company Name (Upload)", key="company_name_upload")
    file = st.file_uploader("Upload a TXT File", type=["txt"])
    file_type = st.selectbox("Select File Type", ["descriptive", "financial"])
    
    if st.button("Upload File"):
        
        if company_name_upload and file and file_type:
            files = {'file': file.getvalue()}
            payload = {
                "company": company_name_upload,
                "file_type": file_type
            }
            print("asdasdf", UPLOAD_API_URL)
            response = requests.post(UPLOAD_API_URL, files=files, data=payload)
            
            if response.status_code == 200:
                st.success("File uploaded successfully.")
            else:
                st.error("Failed to upload the file.")
        else:
            st.warning("Please fill in all fields and upload a file.")
