import { FC, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Node,
  Background,
  Controls,
  useNodesState,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodeComponent from './NodeComponent';

const documents = [
  {
    id: '1',
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
  {
    id: '2',
    title: 'United Kingdom Market Overview',
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
  position: { x: index * 400, y: 100 },
  data: { title: doc.title, content: doc.content },
}));



const NodeType = { node: NodeComponent };

const CanvasPage: FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  return (
    <ReactFlowProvider>
      <div className="h-screen w-full p-4 bg-gray-100">
        <ReactFlow
          nodes={nodes}
          nodeTypes={NodeType}
          edges={[]}
          onNodesChange={onNodesChange}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default CanvasPage;
