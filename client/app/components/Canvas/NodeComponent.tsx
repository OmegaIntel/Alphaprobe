import { FC, lazy, Suspense } from 'react';
import { NodeProps } from 'reactflow';
import { CardContent, Card } from '../ui/card';
const DocumentEdit = lazy(() => import('./DocumentEdit'));

//@ts-ignore
// const BASE_API_URL = "https://api.langflow.astra.datastax.com"
// const LANGFLOW_ID = "1eea4800-d645-4728-b787-db3421512763"
// const FLOW_ID = "f27dd089-cdc7-442c-94a5-beb8624fc3cd"
// const APPLICATION_TOKEN = "AstraCS:cGtSEwWhGqWSGLGNyGmcjWMw:7f13c416a728236bcf75b9644ac6c7a58feefb07f778e208bb09e01f1f30ed83"
// const DocMessage = lazy(()=> import('./DocMessage'))


const NodeComponent: FC<
  NodeProps<{ title: string; content: string; id: string }>
> = ({ data }) => {
  return (
    <Card className="p-2 w-[700px] min-w-96 shadow-lg bg-white hover:border-indigo-500 border-2 cursor-pointer">
      {/* <h3 className="text-lg font-bold">{data.title}</h3> */}
      <CardContent onClick={()=>{
        localStorage.setItem('selectedDocument', JSON.stringify(data))
        console.log('logging================')
      }} className="text-sm text-gray-700">
        <Suspense fallback={<p>Loading Report...</p>}>
          <DocumentEdit content={data.content} />
          {/* <DocMessage api_key={APPLICATION_TOKEN} host_url={BASE_API_URL} flow_id={FLOW_ID} input_type='chat' input_value={data.title} output_type='chat' /> */}
        </Suspense>
      </CardContent>
    </Card>
  );
};

export default NodeComponent;
