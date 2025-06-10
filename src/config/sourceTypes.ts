import { Database, Code, Brain, GitBranch, FileText, Terminal, Users, Mail, Ticket, Wrench, Layers, Lightbulb, Globe, Bookmark } from 'lucide-react';
import { SourceType } from '../types/Memory';

export const sourceTypes: Record<string, SourceType> = {
  'All Sources': { color: '#6366f1', icon: Database },
  'Cursor': { color: '#f59e0b', icon: Code },
  'VSCode': { color: '#007acc', icon: Code },
  'Copilot': { color: '#28a745', icon: Brain },
  'GitHub': { color: '#24292e', icon: GitBranch },
  'GitHub Wiki': { color: '#586069', icon: FileText },
  'Terminal': { color: '#00ff00', icon: Terminal },
  'Teams': { color: '#6264a7', icon: Users },
  'Outlook': { color: '#0078d4', icon: Mail },
  'OneNote': { color: '#80397b', icon: FileText },
  'SharePoint': { color: '#0078d4', icon: Database },
  'Jira': { color: '#0052cc', icon: Ticket },
  'ServiceNow': { color: '#62d84e', icon: Wrench },
  'Figma': { color: '#f24e1e', icon: Layers },
  'Personal': { color: '#8b5cf6', icon: Lightbulb },
  'Web Links': { color: '#10b981', icon: Globe },
  'Bookmarks': { color: '#f59e0b', icon: Bookmark }
};