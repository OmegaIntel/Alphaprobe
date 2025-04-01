
import { FileText, Building2, LucideIcon } from "lucide-react";
export interface ItemType {
    label?: string;
    id?: string;
    icon: LucideIcon;
    url:string;
};
  
export const items: ItemType[] = [
    {
      label: 'Reports',
      id: 'reports',
      icon: FileText,
      url:'/'

    },
    {
      label: 'Company House',
      id: 'company-house',
      icon: Building2,
      url:'/company-house'
    },
];