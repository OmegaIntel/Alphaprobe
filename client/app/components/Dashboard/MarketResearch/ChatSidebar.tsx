import React, { useState } from 'react';
import DocumentPDF from '~/components/PDFViewer/PDFViewer';
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { X, ChevronDown, ChevronUp, FileText } from "lucide-react";

interface Metadata {
  'x-amz-bedrock-kb-document-page-number': number;
  'x-amz-bedrock-kb-source-uri': string;
  'presigned_url': string;
  [key: string]: any;
}

interface DataItem {
  metadata: Metadata;
  chunk_content: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: DataItem[];
}

export function Sidebar({ isOpen, onClose, data }: SidebarProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showPDF, setShowPDF] = useState(false);

  if (typeof window === 'undefined') {
    return null;
  }

  const toggleRow = (index: number) => {
    if (expandedRow === index) {
      setExpandedRow(null);
      setShowPDF(false);
    } else {
      setExpandedRow(index);
      setShowPDF(false);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').flatMap((line, index) => (
      line.split(/ +/)
        .flatMap((word, wordIndex, array) => [
          <React.Fragment key={`word-${index}-${wordIndex}`}>
            {word}{wordIndex < array.length - 1 ? ' ' : ''}
          </React.Fragment>,
          array[wordIndex + 1] && array[wordIndex + 1].length === 0 ? (
            <br key={`br-${index}-${wordIndex}`} />
          ) : null,
        ])
        .concat(<br key={`br-line-${index}`} />)
    ));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[40%] p-0 bg-stone-900 border-l border-stone-800"
      >
        <SheetHeader className="p-4 border-b border-stone-800">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-white">References</SheetTitle>
            {/* <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="text-white hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-stone-800 hover:bg-stone-800">
                  <TableHead className="text-white">Page No.</TableHead>
                  <TableHead className="text-white">Report</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <React.Fragment key={index}>
                    <TableRow 
                      className="border-stone-800 hover:bg-stone-800 cursor-pointer"
                      onClick={() => toggleRow(index)}
                    >
                      <TableCell className="text-white">
                        {item.metadata['x-amz-bedrock-kb-document-page-number']}
                      </TableCell>
                      <TableCell className="text-white">
                        {item.metadata['x-amz-bedrock-kb-source-uri'].split('/').pop()}
                      </TableCell>
                      <TableCell className="text-white">
                        {expandedRow === index ? (
                          <ChevronUp className="h-4 w-4 ml-auto" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        )}
                      </TableCell>
                    </TableRow>

                    {expandedRow === index && (
                      <TableRow className="border-stone-800">
                        <TableCell colSpan={3} className="p-0">
                          <div className="p-4 space-y-4 bg-stone-800/50">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-300">
                                Page: {item.metadata['x-amz-bedrock-kb-document-page-number']}
                              </span>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowPDF(!showPDF)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                {showPDF ? 'View Chunk' : 'Open in PDF'}
                              </Button>
                            </div>

                            <ScrollArea className="h-[300px] w-full rounded-md border border-stone-700">
                              {showPDF ? (
                                <div className="p-4">
                                  <DocumentPDF
                                    pdfUrl={item.metadata.presigned_url}
                                    highlightText=""
                                    heading="View Document"
                                    pageNumber={item.metadata['x-amz-bedrock-kb-document-page-number']}
                                  />
                                </div>
                              ) : (
                                <div className="p-4 text-gray-300">
                                  {formatText(item.chunk_content)}
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}