import { fetcher, fileFetcher } from '~/services/HTTPS';
import { ResearchType, Citation, ConversationData } from './reportUtils';


const templateCode = {
  'market-sizing': 2,
  'company-profile': 0,
  'financial-statement-analysis': 1,
};

const getThetempId = (tempid: string) => {
  if (tempid === 'market-sizing') {
    return 2;
  } else if (tempid === 'financial-statement-analysis') {
    return 1;
  }

  return 0;
};


export const createGetDocumentReport = async ({
  promptValue,
  web_search,
  file_search,
  templateId,
  temp_project_id,
  uploaded_files,
  researchType
}: {
  promptValue: string;
  web_search: boolean;
  file_search: boolean;
  templateId: string;
  projectId?: string;
  temp_project_id: string;
  uploaded_files: any[];
  researchType: ResearchType;
}): Promise<any> => {
  try {
    const tempNum = getThetempId(templateId);
    const config: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        // markdown: 'stocks',
        // title: title,
        // sub_title: subTitle,
        // theme: 'professional',
        instruction: promptValue,
        web_search: web_search,
        file_search: file_search,
        report_type: tempNum,
        project_id: '',
        temp_project_id: temp_project_id,
        uploaded_files: uploaded_files,
        researchType: researchType
        // text: title,
        // headings: headingTemp?.heading,
        // max_depth: 3,
        // include_charts: true,
        // include_tables: true,
      }),
    }; 

    const res = await fetcher('/api/deep-researcher-langgraph/create', config);
    console.log('reports--------------------', res.data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error; // or return [] if you prefer
  }
};

export const updateGetDocumentReport = async ({
  promptValue,
  web_search,
  file_search,
  templateId,
  projectId,
  temp_project_id,
  uploaded_files,
  researchType
}: {
  promptValue: string;
  web_search: boolean;
  file_search: boolean;
  templateId: string;
  projectId: string;
  temp_project_id: string;
  uploaded_files: any[];
  researchType: ResearchType;
}): Promise<any> => {
  try {
    const tempNum = getThetempId(templateId);
    const config: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        // markdown: 'stocks',
        // title: title,
        // sub_title: subTitle,
        // theme: 'professional',
        instruction: promptValue,
        web_search: web_search,
        file_search: file_search,
        report_type: tempNum,
        project_id: projectId,
        temp_project_id: temp_project_id ,
        uploaded_files: uploaded_files,
        researchType: researchType
        // text: title,
        // headings: headingTemp?.heading,
        // max_depth: 3, 
        // include_charts: true,
        // include_tables: true,
      }),
    };

    const res = await fetcher('/api/deep-researcher-langgraph', config);
    console.log('reports--------------------', res.data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error; // or return [] if you prefer
  }
};


export interface UploadFile{
    files: File[];
    project_id: string;
    temp_project_id:string;
}

export const uploadDeepResearchFiles = async (data: UploadFile): Promise<any> => {
  try {
    // Create FormData and append each file with the key "files"
    const files = data.files || [];
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("temp_project_id", data.temp_project_id);

    // Set up the POST request configuration
    const config: RequestInit = {
      method: "POST",
      body: formData,
    };

    // Call the API endpoint
    const response = await fileFetcher("/api/upload-deep-research", config);
    // Parse the response JSON if fileFetcher returns a Response object
    return response
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};


//////////// DUE DILIGENCE OUTLINE FILE UPLOAD FUNCTION /////////////////////////////////
export type UploadOutlineFile = {
  files: File[];
  temp_project_id: string;
};

export type UploadedOutlineFile = {
  file_name: string;
  file_path: string;
  bucket: string;
};

export const uploadOutlineFiles = async (data: UploadOutlineFile): Promise<any> => {
  try {
    // Create FormData and append each file with the key "files"
    const files = data.files || [];
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("temp_project_id", data.temp_project_id);

    // Set up the POST request configuration
    const config: RequestInit = {
      method: "POST",
      body: formData,
    };

    // Call the API endpoint using your custom fetcher
    const response = await fileFetcher("/api/upload-outline-file", config);
    
    return response;
  } catch (error) {
    console.error("Error uploading outline files:", error);
    throw error;
  }
};

export interface ReportList {
  id: string;
  query: string;
  response:string;
  updated_at: string;
  sections: Citation[]
  research: ResearchType;
}
export const getReports = async (project_id : string): Promise<ReportList[]> =>{
  try {
    const config: RequestInit = {
      method: 'GET',
    };
    
    const res = await fetcher(`/api/project/${project_id}/reports`, config);
  
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
     console.error('error------------', error);
     return []
  }
}
