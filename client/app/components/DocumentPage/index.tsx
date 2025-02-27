// import { useState } from "react";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import PromtInput from './PromtInput';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { cn } from '~/lib/utils';

const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'research', name: 'Research' },
  { id: 'markets', name: 'Markets' },
  { id: 'strategy', name: 'Strategy' },
  { id: 'productivity', name: 'Productivity' },
];

const templates = [
  {
    id: 'blank',
    category: 'all',
    title: 'Blank Document',
    description: 'Start a new workspace with all tools available.',
    tags: ['Free writing', 'Brainstorming', 'Note Taking', 'Content Writing'],
  },
  {
    id: 'free-form',
    category: 'research',
    title: 'Free Form',
    description:
      'A foundational template for executing complex tasks step-by-step.',
    tags: ['Multi-step Research', 'Data Analysis', 'Task Delegation'],
  },
  {
    id: 'deep-research',
    category: 'research',
    title: 'Deep Researcher',
    description:
      'A template for holistic topic examination, generating insights.',
    tags: ['Knowledge Mapping', 'Deep Dives', 'Problem Solving'],
  },
];

export default function DocumentCreator() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

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
                    'w-full text-left px-3 py-2 rounded-md text-gray-700',
                    activeTab === cat.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'hover:bg-gray-200'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter(
                (template) =>
                  activeTab === 'all' || template.category === activeTab
              )
              .map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg shadow-sm"
                >
                  <h3 className="text-lg font-medium">{template.title}</h3>
                  <p className="text-sm text-gray-600">
                    {template.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md"
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
