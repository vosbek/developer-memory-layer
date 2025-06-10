import * as vscode from 'vscode';
import { MemoryService, Memory } from '../services/memoryService';
import * as path from 'path';

export class MemoryProvider implements vscode.TreeDataProvider<MemoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MemoryItem | undefined | null | void> = new vscode.EventEmitter<MemoryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MemoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private memories: Memory[] = [];
    private groupBy: 'date' | 'tag' | 'project' | 'type' = 'date';

    constructor(private memoryService: MemoryService) {
        this.loadMemories();
        
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('developerMemory')) {
                this.refresh();
            }
        });
    }

    refresh(): void {
        this.loadMemories();
        this._onDidChangeTreeData.fire();
    }

    private async loadMemories(): Promise<void> {
        try {
            this.memories = await this.memoryService.getCachedMemories();
        } catch (error) {
            console.error('Failed to load memories:', error);
            this.memories = [];
        }
    }

    getTreeItem(element: MemoryItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: MemoryItem): Promise<MemoryItem[]> {
        if (!element) {
            // Root level - show grouping options and recent memories
            return this.getRootItems();
        }

        if (element.type === 'group') {
            return this.getGroupChildren(element);
        }

        if (element.type === 'memory' && element.memory) {
            return this.getMemoryChildren(element.memory);
        }

        return [];
    }

    private async getRootItems(): Promise<MemoryItem[]> {
        const items: MemoryItem[] = [];

        // Add quick actions
        items.push(new MemoryItem(
            'capture',
            '💾 Capture Memory',
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'developerMemory.captureMemory',
                title: 'Capture Memory'
            }
        ));

        items.push(new MemoryItem(
            'search',
            '🔍 Search Memories',
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'developerMemory.searchMemories',
                title: 'Search Memories'
            }
        ));

        // Add separator
        items.push(new MemoryItem('separator', '─────────────', vscode.TreeItemCollapsibleState.None));

        // Add recent memories section
        const recentMemories = this.memories.slice(0, 5);
        if (recentMemories.length > 0) {
            items.push(new MemoryItem(
                'recent',
                `📋 Recent (${recentMemories.length})`,
                vscode.TreeItemCollapsibleState.Expanded,
                undefined,
                'group'
            ));
        }

        // Add grouped sections based on current grouping
        switch (this.groupBy) {
            case 'tag':
                items.push(...this.getTagGroups());
                break;
            case 'project':
                items.push(...this.getProjectGroups());
                break;
            case 'type':
                items.push(...this.getTypeGroups());
                break;
            default:
                items.push(...this.getDateGroups());
        }

        return items;
    }

    private getTagGroups(): MemoryItem[] {
        const tagCounts = new Map<string, number>();
        this.memories.forEach(memory => {
            memory.tags.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });

        return Array.from(tagCounts.entries())
            .sort(([, a], [, b]) => b - a) // Sort by count descending
            .slice(0, 10) // Limit to top 10 tags
            .map(([tag, count]) => new MemoryItem(
                `tag-${tag}`,
                `🏷️ ${tag} (${count})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                'group',
                { groupType: 'tag', groupValue: tag }
            ));
    }

    private getProjectGroups(): MemoryItem[] {
        const projectCounts = new Map<string, number>();
        this.memories.forEach(memory => {
            const project = memory.project || 'Unknown';
            projectCounts.set(project, (projectCounts.get(project) || 0) + 1);
        });

        return Array.from(projectCounts.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([project, count]) => new MemoryItem(
                `project-${project}`,
                `📁 ${project} (${count})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                'group',
                { groupType: 'project', groupValue: project }
            ));
    }

    private getTypeGroups(): MemoryItem[] {
        const typeCounts = new Map<string, number>();
        this.memories.forEach(memory => {
            const type = memory.source?.language || 'unknown';
            typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        });

        const typeIcons: { [key: string]: string } = {
            'javascript': '🟨',
            'typescript': '🔷',
            'python': '🐍',
            'java': '☕',
            'csharp': '🔷',
            'cpp': '⚙️',
            'go': '🐹',
            'rust': '🦀',
            'php': '🐘',
            'ruby': '💎',
            'html': '🌐',
            'css': '🎨',
            'sql': '🗄️',
            'markdown': '📝',
            'unknown': '📄'
        };

        return Array.from(typeCounts.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => new MemoryItem(
                `type-${type}`,
                `${typeIcons[type] || '📄'} ${type} (${count})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                'group',
                { groupType: 'type', groupValue: type }
            ));
    }

    private getDateGroups(): MemoryItem[] {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const groups = {
            today: this.memories.filter(m => new Date(m.createdAt) >= today),
            yesterday: this.memories.filter(m => {
                const date = new Date(m.createdAt);
                return date >= yesterday && date < today;
            }),
            thisWeek: this.memories.filter(m => {
                const date = new Date(m.createdAt);
                return date >= thisWeek && date < yesterday;
            }),
            thisMonth: this.memories.filter(m => {
                const date = new Date(m.createdAt);
                return date >= thisMonth && date < thisWeek;
            }),
            older: this.memories.filter(m => new Date(m.createdAt) < thisMonth)
        };

        const items: MemoryItem[] = [];

        if (groups.today.length > 0) {
            items.push(new MemoryItem(
                'today',
                `📅 Today (${groups.today.length})`,
                vscode.TreeItemCollapsibleState.Expanded,
                undefined,
                'group',
                { groupType: 'date', groupValue: 'today' }
            ));
        }

        if (groups.yesterday.length > 0) {
            items.push(new MemoryItem(
                'yesterday',
                `📅 Yesterday (${groups.yesterday.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                'group',
                { groupType: 'date', groupValue: 'yesterday' }
            ));
        }

        if (groups.thisWeek.length > 0) {
            items.push(new MemoryItem(
                'thisWeek',
                `📅 This Week (${groups.thisWeek.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                'group',
                { groupType: 'date', groupValue: 'thisWeek' }
            ));
        }

        if (groups.thisMonth.length > 0) {
            items.push(new MemoryItem(
                'thisMonth',
                `📅 This Month (${groups.thisMonth.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                'group',
                { groupType: 'date', groupValue: 'thisMonth' }
            ));
        }

        if (groups.older.length > 0) {
            items.push(new MemoryItem(
                'older',
                `📅 Older (${groups.older.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                'group',
                { groupType: 'date', groupValue: 'older' }
            ));
        }

        return items;
    }

    private getGroupChildren(element: MemoryItem): MemoryItem[] {
        if (!element.groupData) {
            return [];
        }

        let filteredMemories: Memory[] = [];

        switch (element.groupData.groupType) {
            case 'tag':
                filteredMemories = this.memories.filter(m => 
                    m.tags.includes(element.groupData!.groupValue)
                );
                break;
            case 'project':
                filteredMemories = this.memories.filter(m => 
                    (m.project || 'Unknown') === element.groupData!.groupValue
                );
                break;
            case 'type':
                filteredMemories = this.memories.filter(m => 
                    (m.source?.language || 'unknown') === element.groupData!.groupValue
                );
                break;
            case 'date':
                filteredMemories = this.getMemoriesByDateGroup(element.groupData.groupValue);
                break;
        }

        if (element.id === 'recent') {
            filteredMemories = this.memories.slice(0, 5);
        }

        return filteredMemories.map(memory => this.createMemoryItem(memory));
    }

    private getMemoriesByDateGroup(dateGroup: string): Memory[] {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (dateGroup) {
            case 'today':
                return this.memories.filter(m => new Date(m.createdAt) >= today);
            case 'yesterday':
                return this.memories.filter(m => {
                    const date = new Date(m.createdAt);
                    return date >= yesterday && date < today;
                });
            case 'thisWeek':
                return this.memories.filter(m => {
                    const date = new Date(m.createdAt);
                    return date >= thisWeek && date < yesterday;
                });
            case 'thisMonth':
                return this.memories.filter(m => {
                    const date = new Date(m.createdAt);
                    return date >= thisMonth && date < thisWeek;
                });
            case 'older':
                return this.memories.filter(m => new Date(m.createdAt) < thisMonth);
            default:
                return [];
        }
    }

    private createMemoryItem(memory: Memory): MemoryItem {
        const icon = this.getMemoryIcon(memory);
        const label = memory.title;
        const description = memory.tags.slice(0, 3).join(', ');
        
        return new MemoryItem(
            memory.id,
            `${icon} ${label}`,
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'developerMemory.openMemory',
                title: 'Open Memory',
                arguments: [memory]
            },
            'memory',
            undefined,
            memory,
            description
        );
    }

    private getMemoryIcon(memory: Memory): string {
        const language = memory.source?.language?.toLowerCase();
        
        const icons: { [key: string]: string } = {
            'javascript': '🟨',
            'typescript': '🔷',
            'python': '🐍',
            'java': '☕',
            'csharp': '🔷',
            'cpp': '⚙️',
            'c': '⚙️',
            'go': '🐹',
            'rust': '🦀',
            'php': '🐘',
            'ruby': '💎',
            'html': '🌐',
            'css': '🎨',
            'scss': '🎨',
            'sql': '🗄️',
            'markdown': '📝',
            'json': '⚙️',
            'yaml': '⚙️',
            'dockerfile': '🐳',
            'bash': '🖥️',
            'shell': '🖥️'
        };

        return icons[language || ''] || '💡';
    }

    private getMemoryChildren(memory: Memory): MemoryItem[] {
        const children: MemoryItem[] = [];
        
        // Add memory details as children
        if (memory.description) {
            children.push(new MemoryItem(
                `${memory.id}-desc`,
                `📝 ${memory.description}`,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                'info'
            ));
        }

        if (memory.source?.file) {
            children.push(new MemoryItem(
                `${memory.id}-file`,
                `📁 ${path.basename(memory.source.file)}:${memory.source.line || '?'}`,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [vscode.Uri.file(memory.source.file)]
                },
                'info'
            ));
        }

        children.push(new MemoryItem(
            `${memory.id}-date`,
            `🕒 ${new Date(memory.createdAt).toLocaleDateString()}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            'info'
        ));

        return children;
    }

    // Public methods for changing grouping
    setGroupBy(groupBy: 'date' | 'tag' | 'project' | 'type'): void {
        this.groupBy = groupBy;
        this.refresh();
    }
}

export class MemoryItem extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly type: 'memory' | 'group' | 'action' | 'separator' | 'info' | 'capture' | 'search' = 'memory',
        public readonly groupData?: { groupType: string; groupValue: string },
        public readonly memory?: Memory,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        
        this.id = id;
        this.tooltip = this.getTooltip();
        this.contextValue = this.getContextValue();
        this.description = description;
        
        if (command) {
            this.command = command;
        }
    }

    private getTooltip(): string {
        if (this.memory) {
            return `${this.memory.title}\n\nTags: ${this.memory.tags.join(', ')}\nProject: ${this.memory.project}\nCreated: ${new Date(this.memory.createdAt).toLocaleDateString()}\n\n${this.memory.description}`;
        }
        
        if (this.groupData) {
            return `Group: ${this.groupData.groupType} - ${this.groupData.groupValue}`;
        }
        
        return this.label;
    }

    private getContextValue(): string {
        switch (this.type) {
            case 'memory':
                return 'memory';
            case 'group':
                return 'group';
            case 'action':
                return 'action';
            default:
                return 'item';
        }
    }
}
