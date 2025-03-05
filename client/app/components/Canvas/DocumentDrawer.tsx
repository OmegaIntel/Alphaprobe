import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react'; // For close icon
import React, { useRef, useState, lazy, Suspense, useEffect } from 'react';
import { Node } from 'reactflow';
const JoditEdit = lazy(() => import('../DocumentEditor/JoditEdit'));
//import Document

let contents: string = `
    <h2>Welcome to Editor.js</h2>
    <p>This is a simple paragraph.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
    </ul>
`;

interface DocumentDrawerProps {
  nodes: Node[]; // 👈 Correctly typed nodes prop
}


const DocumentDrawer: React.FC<DocumentDrawerProps> = ({nodes}) => {
  const editor = useRef(null);
  const editorRef = useRef(null);
  const [value, setValue] = useState<string>(contents);

  useEffect(() => {
    try {
      const selectedDoc = localStorage.getItem('selectedDocument') || '';
      console.log('selectedDoc-------', selectedDoc);
      let data = JSON.parse(selectedDoc);
      const node = nodes.find((item: Node)=> data?.id === item?.id)
      console.log('selectedDoc1-------', data, node);
      setValue(data?.content || '');
    } catch (error) {
      console.error('error---------');
    }
  }, [nodes]);

  return (
    <Dialog.Root>
      {/* Trigger Button */}
      <Dialog.Trigger className="z-[1] bg-indigo-500 text-white absolute top-4 right-0 p-2 pl-4 rounded-s-full">
        Note Book
      </Dialog.Trigger>

      {/* Drawer Overlay */}
      <Dialog.Portal>
        <Dialog.Overlay className="z-[1] fixed inset-0 bg-black/50" />

        {/* Drawer Content */}
        <Dialog.Content className="z-[1] fixed right-0 top-0 h-full w-[650px] bg-white shadow-lg transition-transform data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full">
          <div className="p-4 flex h-11 justify-between items-center border-b">
            <h2 className="text-lg font-bold">Drawer Title</h2>
            <Dialog.Close className="p-2">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className='overflow-x-scroll'>
            <Suspense fallback={<p>Loading editor...</p>}>
              <JoditEdit
                ref={editor}
                editorRef={(ref) => {
                  editorRef.current = ref;
                }}
                config={
                  {
                    // toolbar: true,
                    // readonly: false,
                    // showCharsCounter: false,
                    // showWordsCounter: false,
                    // showXPathInStatusbar: false,
                  }
                }
                tabIndex={1}
                value={value}
                onChange={(value: string) => {
                  setValue(value);
                }}
              />
            </Suspense>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DocumentDrawer;

 