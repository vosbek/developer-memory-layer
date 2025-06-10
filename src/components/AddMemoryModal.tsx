import React, { useState } from 'react';
import { NewMemory } from '../types/Memory';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memory: NewMemory) => void;
  sourceTypes: any;
  memoryTypes: any;
  projects: string[];
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  sourceTypes,
  memoryTypes,
  projects
}) => {
  const [newMemory, setNewMemory] = useState<NewMemory>({
    title: '',
    content: '',
    source: 'Personal',
    tags: [],
    type: 'insight',
    project: 'Current Project',
    links: []
  });

  const handleSubmit = () => {
    if (newMemory.title && newMemory.content) {
      onAdd(newMemory);
      setNewMemory({
        title: '',
        content: '',
        source: 'Personal',
        tags: [],
        type: 'insight',
        project: 'Current Project',
        links: []
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Memory</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={newMemory.title}
              onChange={(e) => setNewMemory({...newMemory, title: e.target.value})}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="What did you learn?"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={newMemory.content}
              onChange={(e) => setNewMemory({...newMemory, content: e.target.value})}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-24"
              placeholder="Describe the insight..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Source</label>
              <select
                value={newMemory.source}
                onChange={(e) => setNewMemory({...newMemory, source: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {Object.keys(sourceTypes).slice(1).map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newMemory.type}
                onChange={(e) => setNewMemory({...newMemory, type: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {Object.entries(memoryTypes).map(([key, type]: [string, any]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              onChange={(e) => setNewMemory({...newMemory, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="react, performance, hooks"
            />
          </div>
        </div>
        
        <div className="flex space-x-4 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Add Memory
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};