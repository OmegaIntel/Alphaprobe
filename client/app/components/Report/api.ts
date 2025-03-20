import { fetcher } from '~/services/HTTPS';

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
}: {
  promptValue: string;
  web_search: boolean;
  file_search: boolean;
  templateId: string;
}): Promise<string> => {
  try {
    // const headingTemp = templateHeading.find((heading) => heading.templateId === templateId)
    const tempNum  =  getThetempId(templateId);
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
        // text: title,
        // headings: headingTemp?.heading,
        // max_depth: 3,
        // include_charts: true,
        // include_tables: true,
      }),
    };

    const res = await fetcher('/api/deep-researcher-langgraph', config);
    console.log('reports--------------------', res.data);
    return res.data as string;
  } catch (error) {
    console.error(error);
    return error as string;
  }
};
