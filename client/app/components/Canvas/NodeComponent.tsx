import { FC, lazy, Suspense } from 'react';
import { NodeProps } from 'reactflow';
import { CardContent, Card } from '../ui/card';

const DocumentEdit = lazy(()=> import('./DocumentEdit'))
const NodeComponent: FC<NodeProps<{ title: string; content: string }>> = ({
  data,
}) => (
  <Card className="p-4 w-[700px] min-w-96 shadow-lg bg-white">
    {/* <h3 className="text-lg font-bold">{data.title}</h3> */}
    <CardContent className="text-sm text-gray-700">
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

export default NodeComponent;
