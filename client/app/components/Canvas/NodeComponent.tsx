import { FC, lazy, Suspense } from 'react';
import { NodeProps } from 'reactflow';
import { CardContent, Card } from '../ui/card';

const DocumentEdit = lazy(() => import('./DocumentEdit'));
const NodeComponent: FC<
  NodeProps<{ title: string; content: string; id: string }>
> = ({ data }) => {
  return (
    <Card className="p-2 w-[700px] min-w-96 shadow-lg bg-white hover:border-indigo-500 border-2">
      {/* <h3 className="text-lg font-bold">{data.title}</h3> */}
      <CardContent onClick={()=>{
        localStorage.setItem('selectedDocument', JSON.stringify(data))
      }} className="text-sm text-gray-700">
        <Suspense fallback={<p>Loading editor...</p>}>
          {/* <EditorComponent
        key={data.title}
        content={data.content}
        onSave={(html) => {
          console.log(html);
        }}
      /> */}
          <DocumentEdit content={data.content} />
        </Suspense>
      </CardContent>
    </Card>
  );
};
export default NodeComponent;
