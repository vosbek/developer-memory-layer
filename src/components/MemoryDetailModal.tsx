import React from 'react';
import { ExternalLink, Lightbulb } from 'lucide-react';
import { Memory } from '../types/Memory';
import { memoryTypes } from '../config/memoryTypes';

interface MemoryDetailModalProps {
  memory: Memory | null;
  onClose: () => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({ memory, onClose }) => {
  if (!memory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {React.createElement(memoryTypes[memory.type]?.icon || Lightbulb, {
              className: "h-6 w-6 mt-1",
              style: { color: memoryTypes[memory.type]?.color }
            })}
            <div>
              <h2 className="text-xl font-bold">{memory.title}</h2>
              <p className="text-sm text-gray-400">
                {memory.source} • {memory.date} • {memory.project}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Content</h3>
            <p className="text-gray-300 bg-gray-900 p-3 rounded-lg">{memory.content}</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {memory.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-600 bg-opacity-20 border border-blue-600 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {memory.links && memory.links.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Links</h3>
              <div className="space-y-2">
                {memory.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-2 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-400 hover:text-blue-300">{link.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};