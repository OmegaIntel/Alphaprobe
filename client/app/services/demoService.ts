import axiosInstance from "./axiosConfig";
import { AxiosResponse } from "axios";

interface RequestFormValues {
  name: string;
  email: string;
  company: string;
  message: string;
}

// Function to send demo request
export const requestDemo = async (
  formData: RequestFormValues
): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await axiosInstance.post(
      `/request-demo`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};