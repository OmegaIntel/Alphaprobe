
import { useState } from "react";
import { Button } from "../ui/button";
import { Upload, X, Send } from "lucide-react";
import { Textarea } from "../ui/textarea";

export default function PromtInput() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles([...files, ...Array.from(e.target.files)]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex items-center border rounded-lg px-4 py-2 w-full max-w-3xl bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500">
      <textarea
        placeholder="Enter a prompt, ask a question, or search the web"
        className="flex-1 bg-transparent outline-none text-gray-700"
      />
      
      {/* File Upload Button */}
      <label className="flex items-center gap-2 cursor-pointer px-3 py-1 bg-gray-200 rounded-md text-sm font-medium">
        <Upload className="w-4 h-4" />
        Add Sources
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Submit Button */}
      <Button className="ml-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
        <Send />
      </Button>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white border rounded-lg shadow-md p-3">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
          <ul className="mt-2 space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between text-sm text-gray-600 border p-2 rounded-md">
                {file.name}
                <button onClick={() => removeFile(index)} className="text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


