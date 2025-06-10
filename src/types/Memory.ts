export interface Memory {
  id: number;
  title: string;
  content: string;
  source: string;
  type: string;
  tags: string[];
  connections: number[];
  strength: number;
  project: string;
  date: string;
  links: MemoryLink[];
}

export interface MemoryLink {
  type: string;
  url: string;
  title: string;
}

export interface NewMemory {
  title: string;
  content: string;
  source: string;
  tags: string[];
  type: string;
  project: string;
  links: MemoryLink[];
}

export interface SourceType {
  color: string;
  icon: any;
}

export interface MemoryType {
  label: string;
  icon: any;
  color: string;
}

export interface GraphNode extends Memory {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}