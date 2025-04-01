export const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'research', name: 'Research' },
  { id: 'markets', name: 'Markets' },
  { id: 'strategy', name: 'Strategy' },
  { id: 'productivity', name: 'Productivity' },
];

export const templates = [
  {
    id: 'blank',
    category: ['all'],
    title: 'Blank Document',
    description: 'Start a new workspace with all tools available.',
    tags: ['Free writing', 'Brainstorming', 'Note Taking', 'Content Writing'],
  },
  {
    id: 'free-form',
    category: ['productivity'],
    title: 'Free Form',
    description:
      'A foundational template for executing complex tasks step-by-step.',
    tags: ['Multi-step Research', 'Data Analysis', 'Task Delegation'],
  },
  {
    id: 'deep-research',
    category: ['research'],
    title: 'Deep Researcher',
    description:
      'A template for holistic topic examination, generating insights.',
    tags: ['Knowledge Mapping', 'Deep Dives', 'Problem Solving'],
  },
  {
    id: 'company-profile',
    category: ['markets', 'strategy'],
    title: 'Company Profile',
    description:
      "comprehensive card set designed to provide detailed overviews of a company's management, business models, industry position, financial performance, corporate actions, and news.",
    tags: [
      'Investment Research',
      'Target Screening',
      'Corporate Due Diligence',
      'Competitive Research',
    ],
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
  {
    id: 'earnings-update',
    category: ['markets'],
    title: 'Earnings Update',
    description:
      'A reliable template for the latest updates on a public company in the context of their most recent earnings. Useful for revising fundamental perspectives in context of performance and strategic initiatives.',
    tags: [
      'Portfolio Monitoring',
      'Investor Relations',
      'Management Consulting',
      'M&A and Strategic Initiatives',
    ],
  },
  {
    id: 'market-sizing',
    category: ['markets','research'],
    title: 'Market Sizing',
    description:
      'Get up to speed on new markets by understanding their size, contours, players, and trends.',
    tags: ['Market Research', 'Business Consulting', 'Strategy', 'Marketing'],
  },
  {
    id: 'issue-breakdown',
    category: ['strategy', 'research'],
    title: 'Issue Breakdown',
    description:
      'A problem solving templates for structured analysis that uses issue trees and root cause analysis to examine problems, evaluate solutions and develop an implementation plan.',
    tags: ['Root Cause Analysis', 'Business Consulting'],
  },
  {
    id: 'management-investor-meetings',
    category: ['markets'],
    title: 'Management/Investor Meetings',
    description:
      "Understand a company's earnings from transcripts of meetings with analysis of key guidance and open questions.",
    tags: ['Investor Relations', 'Portfolio Monitoring', 'Target Screening'],
  },
  {
    id: 'financial-extractor',
    category: ['productivity'],
    title: 'Financial Extractor',
    description:
      'A time-saving utility designed to extract the Income Statement, Balance Sheet, and Cash Flow Statement from corporate filings spanning multiple years. It meticulously considers footnotes and compiles one comprehensive table for each statement type, encompassing data for all available years in the source files.',
    tags: [
      'Data Extraction',
      'Financial Analysis',
      'Investment Research',
      'Financial Due Diligence',
    ],
  },
  {
    id: 'preliminary-diligence',
    category: ['strategy'],
    title: 'Preliminary Diligence',
    description:
      'Review available information on an entity against key diligence checks on ownership, risks, and sanctions. Currently in Beta.',
    tags: [
      'Target Screening',
      'Risk Identification',
      'Corporate Due Diligence',
    ],
  },
  {
    id: 'document-summarizer',
    category: ['productivity'],
    title: 'Document Summarizer',
    description:
      'A time-saving utility to convert extensive, multi-section documents into concise, reliable summaries.',
    tags: ['Summarisation', 'Utilities', 'Strategy'],
  },
  {
    id: 'competitive-landscape',
    category: ['strategy'],
    title: 'Competitive Landscape',
    description:
      'See the complete picture with peer analysis within an industry, market positioning, and strategic moves.',
    tags: [
      'Market Positioning',
      'Product Benchmarking',
      'Go-to-Market (GTM)',
      'Strategy',
    ],
  },
  {
    id: 'Market Trends',
    category: ['markets', 'research'],
    title: 'Market Trends',
    description:
      'A focused template for tracking emerging patterns, industry shifts, and competitive dynamics. Synthesize analytical reports to gain clear distillations.',
    tags: [
      'Tracking Patterns',
      'Players and Behavior',
      ' Research',
      'Strategy',
      'Investment',
    ],
  },
];
