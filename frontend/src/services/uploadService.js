import axios from "axios";
import { API_BASE_URL } from ".";

export const uploadFiles = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const updateDocument = async (document_id, formData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/documents/${document_id}`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const deleteDocument = async (document_id) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/documents/${document_id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const fetchAllDocument = async (dealId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/documents/${dealId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const fetchDocumentById = async (document_id) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/documents/details/${document_id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
