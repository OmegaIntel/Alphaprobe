import { Fragment, FC, useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Node,
  Background,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodeComponent from './NodeComponent';
import DocumentDrawer from './DocumentDrawer';
import { Input } from '../ui/input';
import {
  MoveLeft,
  ChevronRight,
  Info,
  HardDriveUpload,
  Maximize,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setIsCanvas } from '~/store/slices/sideBar';
import { useNavigate, useLocation } from '@remix-run/react';
import { getDocumentReport } from './api';

const documents = [
  {
    id: 'initial0-1',
    title: 'Detailed Analysis of Current Global Market Trends',
    content: `
    <h2>Welcome to Editor.js</h2>
    <p>This is a simple paragraph.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
    </ul>
`,
  },
];
const initialNodes: Node[] = documents.map((doc, index) => ({
  id: doc.id,
  type: 'node',
  position: { x: index * 720, y: 100 },
  data: { title: doc.title, content: doc.content ,id: `initial0-1`,},
}));

const NodeType = { node: NodeComponent };

const CanvasPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const initialInstuctions = location.state?.instructions || '';
  const [promt, setPromt] = useState<string>(initialInstuctions);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const getReport = async (value: string) => {
    const res: string = await getDocumentReport({
      title: promt,
      subTitle: 'Market Size report',
    });
    console.log('report------------------', res);
    setNodes([
      ...nodes,
      {
        id: `${nodes.length}-1`,
        type: 'node',
        position: { x: nodes.length * 720, y: 100 },
        data: {
          title: 'Detailed Analysis of Current Global Market Trends',
          content: `${res}`,
          id: `${nodes.length}-1`,
        },
      },
    ]);
  };

  useEffect(() => {
    if (location.state?.instructions && promt) {
      getReport(promt);
    }
  }, []);

  return (
    <Fragment>
      <ReactFlowProvider>
        <div className="relative h-[91vh] w-full">
          {/* top left controlls */}
          <div className="absolute top-4 left-4 flex gap-2 z-[1]">
            {/* breadcrums */}
            <div className="p-2 bg-white rounded-lg border items-center flex space-x-2 border-gray-600">
              <button
                onClick={() => {
                  navigate('../');
                  dispatch(setIsCanvas(false));
                }}
                className="p-1 rounded bg-gray-200 text-sm font-medium items-center"
              >
                <MoveLeft className="w-4 h-4 text-indigo-600" />
              </button>
              <div className="text-sm text-gray-500">{'New Documents'}</div>
              <ChevronRight className="w-4 h-4" />
              <div className="text-sm">{'new prompt'}</div>
              <button className="p-1 rounded bg-gray-200 text-sm font-medium items-center">
                <Info className="w-5 h-5 text-indigo-600" />
              </button>
            </div>
            <div
              onClick={() => {
                getReport('Why should i invest in Tesla(TSLA)');
              }}
              className="p-2 bg-white rounded-lg border items-center flex space-x-1 border-gray-600"
            >
              <button className="p-1 text-sm font-medium items-center">
                <HardDriveUpload className="w-5 h-5" />
              </button>
              <div className="text-sm font-semibold text-gray-500">
                {'Files(0)'}
              </div>
            </div>
            <div className="p-2 bg-white rounded-lg border items-center flex space-x-1 border-gray-600">
              <button className="p-1 text-sm font-medium items-center">
                <Maximize className="w-5 h-5" />
              </button>
              <div className="text-sm font-semibold text-gray-500">
                {'Recenter'}
              </div>
            </div>
          </div>
          <DocumentDrawer nodes={nodes} />
          <ReactFlow
            nodes={nodes}
            nodeTypes={NodeType}
            edges={[]}
            onNodesChange={onNodesChange}
          >
            <Background />
          </ReactFlow>
          <div className="absolute bottom-4 left-4 w-64 p-2 bg-white shadow-md rounded-lg">
            <Input
              placeholder="What would you like to know?"
              className="w-full p-2 border rounded"
              onChange={(e) => {
                setPromt(e.target.value);
              }}
            />
          </div>
        </div>
      </ReactFlowProvider>
    </Fragment>
  );
};

export default CanvasPage;
