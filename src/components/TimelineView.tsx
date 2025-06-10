import React from 'react';
import { Link } from 'lucide-react';
import { Memory } from '../types/Memory';
import { sourceTypes } from '../config/sourceTypes';
import { memoryTypes } from '../config/memoryTypes';

interface TimelineViewProps {
  memories: Memory[];
  onMemoryClick: (memory: Memory) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ memories, onMemoryClick }) => {
  const sortedMemories = [...memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return (
    <div className="p-6 space-y-4">
      {sortedMemories.map(memory => {
        const TypeIcon = memoryTypes[memory.type]?.icon;
        const SourceIcon = sourceTypes[memory.source]?.icon;
        
        return (
          <div
            key={memory.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
            onClick={() => onMemoryClick(memory)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                {TypeIcon && <TypeIcon className="h-5 w-5" style={{ color: memoryTypes[memory.type]?.color }} />}
                <h3 className="font-semibold">{memory.title}</h3>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                {SourceIcon && <SourceIcon className="h-4 w-4" />}
                <span>{memory.source}</span>
                <span>•</span>
                <span>{memory.date}</span>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-3">{memory.content}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {memory.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-600 bg-opacity-20 border border-blue-600 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                {memory.links && memory.links.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Link className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-gray-400">{memory.links.length}</span>
                  </div>
                )}
                <span className="px-2 py-1 bg-purple-600 bg-opacity-20 border border-purple-600 rounded text-xs">
                  {memory.project}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};