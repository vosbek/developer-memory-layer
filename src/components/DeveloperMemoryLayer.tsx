import React, { useState, useEffect } from 'react';
import { Search, Plus, Brain } from 'lucide-react';
import { Memory, NewMemory } from '../types/Memory';
import { sourceTypes } from '../config/sourceTypes';
import { memoryTypes, projects } from '../config/memoryTypes';
import { sampleMemories } from '../data/sampleMemories';
import { KnowledgeGraph } from './KnowledgeGraph';
import { TimelineView } from './TimelineView';
import { Sidebar } from './Sidebar';
import { MemoryDetailModal } from './MemoryDetailModal';
import { AddMemoryModal } from './AddMemoryModal';

const DeveloperMemoryLayer = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [memoryLimit, setMemoryLimit] = useState(60);
  const [clusterStrength, setClusterStrength] = useState(1.2);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [viewMode, setViewMode] = useState('graph');

  useEffect(() => {
    setMemories(sampleMemories);
    setFilteredMemories(sampleMemories);
  }, []);

  useEffect(() => {
    let filtered = memories;
    
    if (selectedSource !== 'All Sources') {
      filtered = filtered.filter(memory => memory.source === selectedSource);
    }
    
    if (selectedProject !== 'All Projects') {
      filtered = filtered.filter(memory => memory.project === selectedProject);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(memory => 
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredMemories(filtered.slice(0, memoryLimit));
  }, [memories, selectedSource, selectedProject, searchQuery, memoryLimit]);

  const addMemory = (newMemory: NewMemory) => {
    const memory: Memory = {
      ...newMemory,
      id: Date.now(),
      connections: [],
      strength: Math.random() * 0.3 + 0.7,
      tags: newMemory.tags.length ? newMemory.tags : ['untagged'],
      date: new Date().toISOString().split('T')[0],
      links: newMemory.links || []
    };
    setMemories([...memories, memory]);
    setIsAddingMemory(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Brain className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Developer Knowledge Graph</h1>
              <p className="text-sm text-gray-400">Integrated development ecosystem memory</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 w-80"
              />
            </div>
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'graph' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Graph
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Timeline
              </button>
            </div>
            <button
              onClick={() => setIsAddingMemory(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar
          filteredMemories={filteredMemories}
          memories={memories}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          memoryLimit={memoryLimit}
          setMemoryLimit={setMemoryLimit}
          clusterStrength={clusterStrength}
          setClusterStrength={setClusterStrength}
        />

        {/* Main Content */}
        <div className="flex-1 relative">
          {viewMode === 'graph' ? (
            <KnowledgeGraph
              memories={filteredMemories}
              clusterStrength={clusterStrength}
              onNodeClick={setSelectedMemory}
            />
          ) : (
            <TimelineView
              memories={filteredMemories}
              onMemoryClick={setSelectedMemory}
            />
          )}
        </div>
      </div>

      <MemoryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />

      <AddMemoryModal
        isOpen={isAddingMemory}
        onClose={() => setIsAddingMemory(false)}
        onAdd={addMemory}
        sourceTypes={sourceTypes}
        memoryTypes={memoryTypes}
        projects={projects}
      />
    </div>
  );
};

export default DeveloperMemoryLayer;