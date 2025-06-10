import React, { useRef, useEffect } from 'react';
import { GraphNode, Memory } from '../types/Memory';
import { sourceTypes } from '../config/sourceTypes';
import { memoryTypes } from '../config/memoryTypes';

interface KnowledgeGraphProps {
  memories: Memory[];
  clusterStrength: number;
  onNodeClick: (memory: Memory) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  memories,
  clusterStrength,
  onNodeClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawKnowledgeGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const nodes: GraphNode[] = memories.map((memory) => ({
      ...memory,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      vx: 0,
      vy: 0,
      radius: Math.max(12, memory.strength * 30)
    }));

    // Physics simulation
    for (let i = 0; i < 100; i++) {
      nodes.forEach(node => {
        // Repulsion
        nodes.forEach(other => {
          if (node !== other) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
              const force = (100 - distance) * 0.005;
              node.vx += (dx / distance) * force;
              node.vy += (dy / distance) * force;
            }
          }
        });

        // Attraction to connections
        if (node.connections) {
          node.connections.forEach(connId => {
            const connected = nodes.find(n => n.id === connId);
            if (connected) {
              const dx = connected.x - node.x;
              const dy = connected.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const force = distance * 0.0008 * clusterStrength;
              node.vx += (dx / distance) * force;
              node.vy += (dy / distance) * force;
            }
          });
        }

        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.9;
        node.vy *= 0.9;

        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
      });
    }

    // Draw connections
    nodes.forEach(node => {
      if (node.connections) {
        node.connections.forEach(connId => {
          const connected = nodes.find(n => n.id === connId);
          if (connected) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connected.x, connected.y);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const sourceColor = sourceTypes[node.source]?.color || '#6366f1';
      const typeColor = memoryTypes[node.type]?.color || '#6366f1';
      
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
      gradient.addColorStop(0, sourceColor);
      gradient.addColorStop(1, typeColor);
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Link indicator
      if (node.links && node.links.length > 0) {
        ctx.beginPath();
        ctx.arc(node.x + node.radius * 0.7, node.y - node.radius * 0.7, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#10b981';
        ctx.fill();
      }
    });

    // Click handler
    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const clickedNode = nodes.find(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) <= node.radius;
      });
      
      if (clickedNode) {
        onNodeClick(clickedNode);
      }
    };
  };

  useEffect(() => {
    drawKnowledgeGraph();
  }, [memories, clusterStrength]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-screen bg-gray-900"
        style={{ cursor: 'grab' }}
      />
      
      <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg max-w-sm">
        <h3 className="font-medium mb-2">Knowledge Graph</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Click nodes to view details</li>
          <li>• Lines show connections</li>
          <li>• Node size = importance</li>
          <li>• Green dot = has links</li>
        </ul>
      </div>
    </>
  );
};