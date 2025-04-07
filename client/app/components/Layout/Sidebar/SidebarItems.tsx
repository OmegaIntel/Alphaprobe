
// import { FileText, Building2, LucideIcon } from "lucide-react";
// export interface ItemType {
//     label?: string;
//     id?: string;
//     icon: LucideIcon;
//     url:string;
// };
  
// export const items: ItemType[] = [
//     {
//       label: 'Due Diligence',
//       id: 'duediligence',
//       icon: FileText,
//       url:'/'

//     },
//     {
//       label: 'Company House',
//       id: 'company-house',
//       icon: Building2,
//       url:'/company-house'
//     },
// ];

import { FileText, BookOpen, Search, Scale, LucideIcon } from "lucide-react";

export interface ItemType {
  label?: string;
  id?: string;
  icon: LucideIcon;
  url: string;
}

export const items: ItemType[] = [
  {
    label: "Due Diligence",
    id: "due-diligence",
    icon: FileText,
    url: "/",
  },
  {
    label: "Market Research",
    id: "market-research",
    icon: BookOpen,
    url: "/company-house",
  },
  {
    label: "Sourcing",
    id: "sourcing",
    icon: Search,
    url: "/company-house",
  },
  {
    label: "Valuation",
    id: "valuation",
    icon: Scale,
    url: "/company-house",
  },
];
