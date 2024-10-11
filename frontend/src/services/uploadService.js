import { token } from ".";
import axiosInstance from "./axiosConfig";

export const uploadFiles = async (formData) => {
  try {
    const response = await axiosInstance.post(`/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const updateDocument = async (document_id, formData) => {
  try {
    const response = await axiosInstance.put(
      `/documents/${document_id}`,
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
    const response = await axiosInstance.delete(`/documents/${document_id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const fetchAllDocument = async (dealId) => {
  try {
    const response = await axiosInstance.get(`/documents/${dealId}`, {
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
    const response = await axiosInstance.get(
      `/documents/details/${document_id}`,
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
