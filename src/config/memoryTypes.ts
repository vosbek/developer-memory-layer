import { Bug, Code, Cpu, Users, Lightbulb, Settings, FileText, Layers, Ticket, ExternalLink } from 'lucide-react';
import { MemoryType } from '../types/Memory';

export const memoryTypes: Record<string, MemoryType> = {
  'bug-fix': { label: 'Bug Fix', icon: Bug, color: '#ef4444' },
  'code-snippet': { label: 'Code Snippet', icon: Code, color: '#10b981' },
  'architecture': { label: 'Architecture', icon: Cpu, color: '#8b5cf6' },
  'meeting': { label: 'Meeting', icon: Users, color: '#f59e0b' },
  'insight': { label: 'Insight', icon: Lightbulb, color: '#06b6d4' },
  'tool-tip': { label: 'Tool Tip', icon: Settings, color: '#84cc16' },
  'documentation': { label: 'Documentation', icon: FileText, color: '#6366f1' },
  'design': { label: 'Design', icon: Layers, color: '#f24e1e' },
  'ticket': { label: 'Ticket/Issue', icon: Ticket, color: '#0052cc' },
  'link': { label: 'External Link', icon: ExternalLink, color: '#10b981' }
};

export const projects = [
  'All Projects', 
  'UserDashboard v2.1', 
  'API Gateway', 
  'Mobile App', 
  'Design System v3', 
  'Authentication Service', 
  'Monitoring Setup', 
  'Q2 Roadmap'
];