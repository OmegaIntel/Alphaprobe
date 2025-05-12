import { FileText, BookOpen, Search, Scale, LucideIcon, FileChartColumnIncreasing } from 'lucide-react';

export interface ItemType {
  label?: string;
  id?: string;
  icon: LucideIcon;
  url: string;
  workflowType: 'due_diligence' | 'market_research' | 'competitive_analysis' | 'general';
}

export const items: ItemType[] = [
  {
    label: 'Due Diligence',
    id: 'due-diligence',
    icon: FileText,
    url: '/due-diligence',
    workflowType: 'due_diligence',
  },
  {
    label: 'Market Research',
    id: 'market-research',
    icon: BookOpen,
    url: '/market-research',
    workflowType: 'market_research',
  },
  {
    label: 'Sourcing',
    id: 'sourcing',
    icon: Search,
    url: '/company-house',
    workflowType: 'competitive_analysis',
  },
  {
    label: 'Valuation',
    id: 'valuation',
    icon: Scale,
    url: '/company-house',
    workflowType: 'general',
  },
  {
    label: 'Financial Model',
    id: 'financialmodel',
    icon: FileChartColumnIncreasing,
    url: '/financial-model',
    workflowType: 'general',
  },
];
