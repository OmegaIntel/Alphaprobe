import { fetcher, fileFetcher } from '~/services/HTTPS';

type Section = {
  name: string;
  description: string;
  research: boolean;
  content: string;
  citations: any[];
};

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

export const getDocumentReport = async ({
  promptValue,
  web_search,
  file_search,
  templateId,
  projectId,
}: {
  promptValue: string;
  web_search: boolean;
  file_search: boolean;
  templateId: string;
  projectId: string;
}): Promise<Section[]> => {
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
        // text: title,
        // headings: headingTemp?.heading,
        // max_depth: 3,
        // include_charts: true,
        // include_tables: true,
      }),
    };

    // This fetcher should return a JSON object:
    // { description: string; data: string; message: string; sections: any[] }
    const res = await fetcher('/api/deep-researcher-langgraph', config);

    // The 'sections' array is inside 'res.sections'
    console.log('reports--------------------', res);

    // Return ONLY the sections array
    return res.sections;
  } catch (error) {
    console.error(error);
    throw error; // or return [] if you prefer
  }
};


export const uploadDeepResearchFiles = async (files: File[]): Promise<any> => {
  try {
    // Create FormData and append each file with the key "files"
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

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
