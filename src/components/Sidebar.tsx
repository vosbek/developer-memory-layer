import React from 'react';
import { Filter } from 'lucide-react';
import { Memory } from '../types/Memory';
import { sourceTypes } from '../config/sourceTypes';
import { projects } from '../config/memoryTypes';

interface SidebarProps {
  filteredMemories: Memory[];
  memories: Memory[];
  selectedSource: string;
  setSelectedSource: (source: string) => void;
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  memoryLimit: number;
  setMemoryLimit: (limit: number) => void;
  clusterStrength: number;
  setClusterStrength: (strength: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  filteredMemories,
  memories,
  selectedSource,
  setSelectedSource,
  selectedProject,
  setSelectedProject,
  memoryLimit,
  setMemoryLimit,
  clusterStrength,
  setClusterStrength
}) => {
  return (
    <div className="w-80 border-r border-gray-800 bg-gray-900 p-6 max-h-screen overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Controls
          </h2>
          <p className="text-sm text-gray-400 mb-4">{filteredMemories.length} memories shown</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Source</label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {Object.keys(sourceTypes).map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Memory Limit: {memoryLimit}</label>
          <input
            type="range"
            min="10"
            max="100"
            value={memoryLimit}
            onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cluster Strength: {clusterStrength}</label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={clusterStrength}
            onChange={(e) => setClusterStrength(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-3">Sources</h3>
          <div className="space-y-2">
            {Object.entries(sourceTypes).slice(1, 9).map(([source, config]) => {
              const IconComponent = config.icon;
              const count = memories.filter(m => m.source === source).length;
              return (
                <div key={source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <IconComponent className="h-4 w-4" />
                    <span>{source}</span>
                  </div>
                  <span className="text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};