import streamlit as st
import requests
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get the API endpoints from the environment variables
CHAT_API_URL = os.getenv("CHAT_API_URL")
UPLOAD_API_URL = os.getenv("UPLOAD_API_URL")
REGISTER_COMPANY_API_URL = os.getenv("REGISTER_COMPANY_API_URL")
COMPANIES_API_URL = os.getenv("COMPANIES_API_URL")

# Custom CSS to style the interface
st.markdown(
    """
    <style>
    .css-1lcbmhc {
        background-color: #2e3b4e;
        color: white;
    }
    .css-1lcbmhc a {
        color: white;
        text-decoration: none;
    }
    .css-1lcbmhc a:hover {
        color: #1e9bf0;
    }
    .main-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }
    .chat-container {
        flex-grow: 1;
        overflow-y: auto;
    }
    .message {
        margin: 10px 0;
    }
    .user-message {
        text-align: right;
        color: #ffffff;
        background-color: #1e9bf0;
        padding: 10px;
        border-radius: 10px;
        display: inline-block;
    }
    .ai-message {
        text-align: left;
        color: #000000;
        background-color: #f1f1f1;
        padding: 10px;
        border-radius: 10px;
        display: inline-block;
    }
    .input-container {
        display: flex;
        align-items: center;
        margin-top: 10px;
        position: fixed;
        bottom: 0;
        width: 100%;
        background-color: #2e3b4e;
        padding: 10px;
    }
    .input-container textarea {
        flex-grow: 1;
        margin-right: 10px;
        color: white;
        background-color: #2e3b4e;
    }
    .dropdown-container {
        margin-top: 20px;
    }
    .css-12oz5g7 {
        background-color: #2e3b4e;
        color: white;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Function to register a new company
def register_company(company_name):
    payload = {"company_name": company_name}
    headers = {
        "Content-Type": "application/json"
    }
    response = requests.post(REGISTER_COMPANY_API_URL, headers=headers, json=payload)
    return response.status_code == 200

# Function to get list of companies from the API
def get_companies():
    response = requests.get(COMPANIES_API_URL)
    if response.status_code == 200:
        return response.json()["companies"]
    else:
        return []

# Function to send a message to the chat API and update the conversation
def send_message(company_name_chat, message):
    # Append user message to session state
    st.session_state["conversation"].append({"role": "user", "content": message})

    payload = {
        "company": company_name_chat,
        "conversation": st.session_state["conversation"]
    }
    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(CHAT_API_URL, headers=headers, json=payload)

    if response.status_code == 200:
        response_data = response.json()
        formatted_response = response_data.get("response", "No response received")

        # Append AI response to session state
        st.session_state["conversation"].append({"role": "ai", "content": formatted_response})
    else:
        st.error("Failed to get a response from the API.")

# Title of the Streamlit app
st.sidebar.title("ChatGPT Interface")
st.sidebar.markdown("## Navigation")
tab_selection = st.sidebar.radio("Choose a tab", ["Chat", "Upload"])

# Chat interface with session management
if tab_selection == "Chat":
    st.markdown("## Chat with API")
    
    # Fetch the list of companies
    companies = get_companies()
    
    # Initialize session state for conversation
    if "conversation" not in st.session_state:
        st.session_state["conversation"] = []

    # Display conversation history in a chat-like interface
    st.markdown("### Conversation History")
    chat_container = st.container()
    with chat_container:
        for entry in st.session_state["conversation"]:
            role = "user-message" if entry["role"] == "user" else "ai-message"
            st.markdown(f'<div class="message {role}">{entry["content"]}</div>', unsafe_allow_html=True)

    # Input area for new messages
    st.markdown("### Send a Message")
    with st.container():
        company_name_chat = st.selectbox("Select or Enter Company Name", options=companies, index=0, key="company_name_chat")
        message = st.text_area("Message", key="message_input", height=50)
        
        if st.button("Send Message"):
            if company_name_chat and message:
                send_message(company_name_chat, message)
                st.rerun()

# File upload interface
elif tab_selection == "Upload":
    st.markdown("## Upload a File to API")
    
    # Fetch the list of companies
    companies = get_companies()
    
    add_new_company = st.checkbox("Add a new company")
    
    if add_new_company:
        company_name_upload = st.text_input("New Company Name", key="new_company_name_upload")
    else:
        company_name_upload = st.selectbox("Select a Company Name", options=companies, key="company_name_upload")
        
    file = st.file_uploader("Upload a TXT File", type=["txt"])
    file_type = st.selectbox("Select File Type", ["descriptive", "financial"])
    
    if st.button("Upload File"):
        if company_name_upload and file and file_type:
            # Check if the company is new and register it
            if add_new_company:
                if register_company(company_name_upload):
                    st.success(f"Registered new company: {company_name_upload}")
                else:
                    st.error("Failed to register new company.")
                
            files = {'file': file.getvalue()}
            payload = {
                "company": company_name_upload,
                "file_type": file_type
            }
            
            response = requests.post(UPLOAD_API_URL, files=files, data=payload)
            
            if response.status_code == 200:
                st.success("File uploaded successfully.")
            else:
                st.error("Failed to upload the file.")
        else:
            st.warning("Please fill in all fields and upload a file.")
