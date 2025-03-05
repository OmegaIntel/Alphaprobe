// import { useState } from "react";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import PromtInput from './PromtInput';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { cn } from '~/lib/utils';
import { categories, templates } from './utils';
import { useNavigate } from '@remix-run/react';



export default function DocumentCreator() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  return (
    <div className="mx-auto">
      {/* Sidebar */}
      <div>
        <h1 className="text-xl font-semibold mb-4">
          Get started with a new document
        </h1>
        <div className="flex gap-2">
          <PromtInput />
        </div>
      </div>
      <div className='my-7'>
      <h1 className="text-xl font-semibold">
          Or choose a template
      </h1>
      <p className='text-xs text-gray-500'>Choose the right template below for your document type</p>
      </div>
      <div className="flex">
        <div className="w-60">
          <Tabs
            defaultValue="all"
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex flex-col gap-2">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-gray-700 text-sm',
                    activeTab === cat.id
                      ? 'bg-indigo-100 text-indigo-600 border-indigo-600 font-semibold'
                      : 'hover:bg-indigo-100 bg-gray-100'
                  )}
                >
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-6">
          <div className="grid grid-cols-1 gap-3 h-[470px] overflow-y-scroll">
            {templates
              .filter(
                (template) =>
                  activeTab === 'all' || template.category.some((cat)=> cat === activeTab) 
              )
              .map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg shadow-sm hover:bg-indigo-100"
                  onClick={()=>{
                    navigate({pathname: "/newdocument",
                      search: `?template=${template.id}`,
                      hash: ""})
                  }}
                >
                  <h3 className="text-sm font-semibold">{template.title}</h3>
                  <p className="text-xs text-gray-400">
                    {template.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
