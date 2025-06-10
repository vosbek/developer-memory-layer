import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export interface Memory {
    id: string;
    title: string;
    content: string;
    description: string;
    tags: string[];
    source: {
        type: string;
        file?: string;
        line?: number;
        language?: string;
    };
    project: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMemoryRequest {
    title: string;
    content: string;
    description: string;
    tags: string[];
    source: {
        type: string;
        file?: string;
        line?: number;
        language?: string;
    };
    project: string;
}

export interface SearchResult extends Memory {
    relevance: number;
    reason: string;
}

export class MemoryService {
    private client: AxiosInstance;
    private apiUrl: string;

    constructor() {
        this.apiUrl = this.getApiUrl();
        this.client = axios.create({
            baseURL: this.apiUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'VS Code Developer Memory Layer Extension/1.0.0'
            }
        });

        // Add request interceptor for authentication if needed
        this.client.interceptors.request.use(
            (config) => {
                // Add JWT token if available
                const token = this.getAuthToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                this.handleApiError(error);
                return Promise.reject(error);
            }
        );
    }

    private getApiUrl(): string {
        const config = vscode.workspace.getConfiguration('developerMemory');
        return config.get<string>('apiUrl', 'http://localhost:4000');
    }

    private getAuthToken(): string | undefined {
        // For now, we'll implement basic auth later
        // This could read from VS Code secrets or config
        return undefined;
    }

    private handleApiError(error: any) {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const message = error.response.data?.message || error.message;
            
            if (status === 401) {
                vscode.window.showErrorMessage('🔐 Authentication required. Please configure your API credentials.');
            } else if (status === 403) {
                vscode.window.showErrorMessage('🚫 Access denied. Check your permissions.');
            } else if (status === 404) {
                vscode.window.showErrorMessage('🔍 Memory Layer API not found. Is the server running?');
            } else if (status >= 500) {
                vscode.window.showErrorMessage('🔥 Server error. Please try again later.');
            } else {
                vscode.window.showErrorMessage(`❌ API Error: ${message}`);
            }
        } else if (error.request) {
            // Network error
            vscode.window.showErrorMessage(
                '🌐 Cannot connect to Memory Layer API. Please check that the server is running at ' + this.apiUrl
            );
        } else {
            // Other error
            vscode.window.showErrorMessage(`❌ Unexpected error: ${error.message}`);
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.client.get('/api/health');
            return true;
        } catch (error) {
            return false;
        }
    }

    async createMemory(memory: CreateMemoryRequest): Promise<Memory> {
        const response = await this.client.post('/api/memories', memory);
        return response.data;
    }

    async getMemories(limit = 50): Promise<Memory[]> {
        const response = await this.client.get(`/api/memories?limit=${limit}`);
        return response.data;
    }

    async getMemory(id: string): Promise<Memory> {
        const response = await this.client.get(`/api/memories/${id}`);
        return response.data;
    }

    async updateMemory(id: string, updates: Partial<CreateMemoryRequest>): Promise<Memory> {
        const response = await this.client.patch(`/api/memories/${id}`, updates);
        return response.data;
    }

    async deleteMemory(id: string): Promise<void> {
        await this.client.delete(`/api/memories/${id}`);
    }

    async searchMemories(query: string, limit = 10): Promise<SearchResult[]> {
        const response = await this.client.get(`/api/memories/search`, {
            params: { q: query, limit }
        });
        return response.data;
    }

    async getContextualSuggestions(
        content: string, 
        language: string, 
        filename: string,
        limit = 5
    ): Promise<SearchResult[]> {
        const response = await this.client.post('/api/memories/contextual', {
            content,
            language,
            filename,
            limit
        });
        return response.data;
    }

    async generateTags(filename: string, content: string): Promise<string[]> {
        try {
            const response = await this.client.post('/api/memories/generate-tags', {
                filename,
                content
            });
            return response.data.tags || this.fallbackTagGeneration(filename, content);
        } catch (error) {
            // Fallback to client-side tag generation if API fails
            return this.fallbackTagGeneration(filename, content);
        }
    }

    private fallbackTagGeneration(filename: string, content: string): string[] {
        const tags: string[] = [];
        
        // File extension based tags
        const ext = filename.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string[] } = {
            'js': ['javascript', 'frontend'],
            'ts': ['typescript', 'frontend'],
            'jsx': ['react', 'javascript', 'frontend'],
            'tsx': ['react', 'typescript', 'frontend'],
            'py': ['python', 'backend'],
            'java': ['java', 'backend'],
            'cs': ['csharp', 'backend'],
            'cpp': ['cpp', 'backend'],
            'c': ['c', 'backend'],
            'go': ['golang', 'backend'],
            'rs': ['rust', 'backend'],
            'php': ['php', 'backend'],
            'rb': ['ruby', 'backend'],
            'css': ['css', 'frontend', 'styling'],
            'scss': ['sass', 'css', 'frontend', 'styling'],
            'html': ['html', 'frontend', 'markup'],
            'sql': ['sql', 'database'],
            'json': ['json', 'config'],
            'yml': ['yaml', 'config'],
            'yaml': ['yaml', 'config'],
            'md': ['markdown', 'documentation'],
            'dockerfile': ['docker', 'devops'],
            'sh': ['bash', 'scripting', 'devops']
        };

        if (ext && languageMap[ext]) {
            tags.push(...languageMap[ext]);
        }

        // Content-based tags
        const contentLower = content.toLowerCase();
        const patterns: { [key: string]: string[] } = {
            'react': ['useState', 'useEffect', 'jsx', 'component'],
            'vue': ['vue', 'v-if', 'v-for', '@click'],
            'angular': ['@Component', '@Injectable', 'ngOnInit'],
            'nodejs': ['require(', 'module.exports', 'express'],
            'database': ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE TABLE'],
            'api': ['fetch(', 'axios', 'http', 'endpoint'],
            'testing': ['test(', 'describe(', 'expect(', 'jest', 'mocha'],
            'authentication': ['auth', 'login', 'password', 'token', 'jwt'],
            'security': ['hash', 'encrypt', 'decrypt', 'secure'],
            'performance': ['optimize', 'cache', 'performance', 'speed'],
            'error-handling': ['try', 'catch', 'error', 'exception'],
            'async': ['async', 'await', 'Promise', 'setTimeout'],
            'algorithms': ['sort', 'search', 'algorithm', 'complexity'],
            'data-structures': ['array', 'object', 'map', 'set', 'list']
        };

        for (const [tag, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => contentLower.includes(keyword))) {
                tags.push(tag);
            }
        }

        // Framework/library detection
        const frameworks: { [key: string]: string[] } = {
            'express': ['express'],
            'fastify': ['fastify'],
            'koa': ['koa'],
            'nestjs': ['@nestjs'],
            'spring': ['@SpringBootApplication', '@RestController'],
            'django': ['django', 'from django'],
            'flask': ['from flask'],
            'laravel': ['use Illuminate'],
            'rails': ['Rails.application']
        };

        for (const [framework, patterns] of Object.entries(frameworks)) {
            if (patterns.some(pattern => contentLower.includes(pattern.toLowerCase()))) {
                tags.push(framework);
            }
        }

        // Remove duplicates and limit to reasonable number
        return [...new Set(tags)].slice(0, 8);
    }

    async getMemoryStats(): Promise<{ total: number; byTag: { [tag: string]: number } }> {
        try {
            const response = await this.client.get('/api/memories/stats');
            return response.data;
        } catch (error) {
            // Fallback stats
            const memories = await this.getMemories();
            const byTag: { [tag: string]: number } = {};
            
            memories.forEach(memory => {
                memory.tags.forEach(tag => {
                    byTag[tag] = (byTag[tag] || 0) + 1;
                });
            });

            return {
                total: memories.length,
                byTag
            };
        }
    }

    async getRecentMemories(limit = 10): Promise<Memory[]> {
        const response = await this.client.get(`/api/memories/recent?limit=${limit}`);
        return response.data;
    }

    async getMemoriesByTag(tag: string, limit = 20): Promise<Memory[]> {
        const response = await this.client.get(`/api/memories/by-tag/${encodeURIComponent(tag)}?limit=${limit}`);
        return response.data;
    }

    async getMemoriesByProject(project: string, limit = 20): Promise<Memory[]> {
        const response = await this.client.get(`/api/memories/by-project/${encodeURIComponent(project)}?limit=${limit}`);
        return response.data;
    }

    // Utility methods for VS Code specific functionality
    async getRelatedMemories(currentFile: string, limit = 5): Promise<SearchResult[]> {
        const filename = currentFile.split(/[/\\]/).pop() || '';
        const response = await this.client.get('/api/memories/related', {
            params: { filename, limit }
        });
        return response.data;
    }

    async exportMemories(format: 'json' | 'csv' | 'markdown' = 'json'): Promise<string> {
        const response = await this.client.get(`/api/memories/export?format=${format}`);
        return response.data;
    }

    async importMemories(data: any): Promise<{ imported: number; errors: string[] }> {
        const response = await this.client.post('/api/memories/import', data);
        return response.data;
    }

    // Cache management
    private memoryCache = new Map<string, { data: Memory[]; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    async getCachedMemories(): Promise<Memory[]> {
        const cacheKey = 'all_memories';
        const cached = this.memoryCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        const memories = await this.getMemories();
        this.memoryCache.set(cacheKey, { data: memories, timestamp: Date.now() });
        return memories;
    }

    clearCache(): void {
        this.memoryCache.clear();
    }

    // Real-time updates (for future WebSocket integration)
    private eventListeners: Array<(event: string, data: any) => void> = [];

    addEventListener(callback: (event: string, data: any) => void): void {
        this.eventListeners.push(callback);
    }

    removeEventListener(callback: (event: string, data: any) => void): void {
        const index = this.eventListeners.indexOf(callback);
        if (index > -1) {
            this.eventListeners.splice(index, 1);
        }
    }

    private notifyListeners(event: string, data: any): void {
        this.eventListeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                console.error('Event listener error:', error);
            }
        });
    }
}
