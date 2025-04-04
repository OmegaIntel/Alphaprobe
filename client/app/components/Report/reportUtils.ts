import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
export interface BaseData {
  type: string;
}

export interface BasicData extends BaseData {
  type: 'basic';
  content: string;
}

export interface LanggraphButtonData extends BaseData {
  type: 'langgraphButton';
  link: string;
}

export interface DifferencesData extends BaseData {
  type: 'differences';
  content: string;
  output: string;
}

export interface QuestionData extends BaseData {
  type: 'question';
  content: string;
}

export interface ChatData extends BaseData {
  type: 'chat';
  content: string;
}

export type Data =
  | BasicData
  | LanggraphButtonData
  | DifferencesData
  | QuestionData
  | ChatData;

export interface ChatBoxSettings {
  report_type: string;
  report_source: string;
  tone: string;
  domains: string[];
  defaultReportType: string;
}

export interface Domain {
  value: string;
}

export interface ResearchHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  orderedData: Data[];
}

export type ResearchType = 'deep' | 'research'

export interface Section {
  name: string;
  description: string;
  research: boolean;
  content: string;
  citations: any[];
};

export interface ConversationData  {
  id?: string;
  query: string;
  res: string;
  res_id?: string;
  updated_at?: string;
  sections: Section[];
  researchType: ResearchType;
};


export type ReportType =
  | 'market-sizing'
  | 'financial-statement-analysis'
  | 'custom_report';


export interface InitialFormData {
    reportType: ReportType;
    preferences: { web: boolean; file: boolean };
    uploadedDocuments: any[];
    promptValue: string;
    temp_project_id: string;
    researchType: ResearchType;
}

export const templates = [
  {
    id: 'market-sizing',
    category: ['markets','research'],
    title: 'Market Sizing',
    description:
      'Get up to speed on new markets by understanding their size, contours, players, and trends.',
    tags: ['Market Research', 'Business Consulting', 'Strategy', 'Marketing'],
  },
  {
    id: 'financial-statement-analysis',
    category: ['markets'],
    title: 'Financial Statement Analysis',
    description:
      "A detailed guide for conducting an exhaustive financial statement analysis, tailored for professionals seeking to evaluate a company's financial health and investment potential.",
    tags: [
      'Financial Analysis',
      'Ratio and Trend Analysis',
      'Portfolio Monitoring',
      'Valuation',
    ],
  },
]

export const researchTypeOptions = [
  {
    label : "Research",
    value: "research",
    id: "research",
    timeDurations: "2-5 minutes"
  },
  {
    label : "Deep Research",
    value: "deep",
    id: "deep",
    timeDurations: "7-12 minutes"
  }
]


export const generatePDF = async (filename : string, contentRef : React.RefObject<HTMLDivElement>) => {
  const content = contentRef.current;
  

  console.log("contentRef--------------", content)
  if (!content) return;

  const pdf = new jsPDF({
    orientation: "p", // Portrait mode
    unit: "mm",
    format: "a4",
    compress: true, // Enable compression for a smaller PDF
  });



  if (!content) {
    console.error("No content found to convert to PDF!");
    return;
  }

  // Convert HTML to PDF (without images)
  pdf.html(content, {
    callback: (pdf) => {
      pdf.save("document.pdf");
    },
    x: 10, // Left margin
    y: 10, // Top margin
    width: 180, // Adjust to fit within A4
    windowWidth: 700, // Simulates screen width for proper scaling
  });
  
  


};