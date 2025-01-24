import React, { useState } from 'react';
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CustomReportSearchForm from "./PreloadingScreen";
import DynamicContent from "./Report";
import { RootState } from "~/store/store";
import { DealsSidebar } from "./CustomReportSidebar";
import { Button } from '~/components/ui/button';

interface UrlParams {
 companyName?: string;
}

export function CustomReportLayout({ companyName }: UrlParams) {
 const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
 const { data } = useSelector((state: RootState) => state.customReport);

 return (
   <div className="flex h-screen">
     {/* Sidebar with collapse/expand */}
     <aside className={`relative transition-all duration-300 ease-in-out border-r  ${
       isSidebarCollapsed ? 'w-2' : 'w-64'
     }`}>
       <Button
         variant="ghost"
         size="icon"
         className="absolute -right-3 top-4 z-10 rounded-full border shadow-sm"
         onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
       >
         {isSidebarCollapsed ? (
           <ChevronRight className="h-3 w-3 " />
         ) : (
           <ChevronLeft className="h-3 w-3" />
         )}
       </Button>
       <div className={`overflow-hidden ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
         <DealsSidebar />
       </div>
     </aside>

     {/* Main Content */}
     <main className="flex-1 p-6 overflow-y-auto">
       <div className={`transition-all duration-300 ${
         data?.report ? 'max-w-4xl mx-auto' : 'flex justify-center'
       }`}>
         {data?.report && data?.dealId ? (
           <DynamicContent report={data.report} />
         ) : (
           <CustomReportSearchForm companyQuery={companyName} />
         )}
       </div>
     </main>
   </div>
 );
}

export default CustomReportLayout;