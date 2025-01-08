// import React from 'react'
// import {ChatInterface }from './ChatSearch'

// const MarketResearchChatLayout = () => {
//   return (
//     <div>
//         <ChatInterface />
//     </div>
//   )
// }

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ChatInterface } from "./ChatSearch";
import { ChatSession } from "./ChatSessions";
import { ChatDisplay } from "./ChatDisplay";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

interface ChatState {
 chat: {
   interactions: Array<{
     id: string;
     query: string;
     response?: any;
   }>;
 };
}

export function SummaryPoints() {
 const [isClient, setIsClient] = useState(false);
 const interactions = useSelector((state: ChatState) => state.chat.interactions);
 const isFirstQueryMade = interactions.length > 0;

 useEffect(() => {
   setIsClient(true);
 }, []);

 if (!isClient) {
   return null;
 }

 return (
   <div className="w-full overflow-hidden">
     <ScrollArea className="px-3 py-2">
       <div className="relative">
         {/* Chat Session */}
         <div>
           <ChatSession />
         </div>

         {/* Main Content */}
         <div>
           {/* Chat Display */}
           <div 
             className={cn(
               "transition-all duration-300",
               isFirstQueryMade ? "block" : "hidden"
             )}
           >
             <ChatDisplay />
           </div>

           {/* Chat Interface */}
           <div
             className={cn(
               "transition-all duration-300",
               isFirstQueryMade
                 ? "fixed bottom-0 left-60 right-60"
                 : "flex flex-col items-center py-32"
             )}
           >
             <ChatInterface />
           </div>
         </div>
       </div>
     </ScrollArea>
   </div>
 );
}

export default SummaryPoints;