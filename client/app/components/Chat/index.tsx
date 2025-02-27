export default function ChatInterface() {
    return (
      <div className="w-full max-w-2xl mt-6 p-4 bg-white shadow-md rounded-lg flex flex-col">
        <div className="flex items-center p-3 border-b">
          <span className="text-gray-700">✏️ What are the best open opportunities by company size?</span>
        </div>
        <div className="flex justify-between p-3">
          <select className="border p-2 rounded">
            <option>Salesforce</option>
          </select>
          <button className="bg-green-500 p-2 rounded-full text-white hover:bg-green-600">▶</button>
        </div>
      </div>
    );
  }