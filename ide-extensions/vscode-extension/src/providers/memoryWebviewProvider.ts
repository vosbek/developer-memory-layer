import * as vscode from 'vscode';
import { MemoryService, Memory, SearchResult } from '../services/memoryService';

export class MemoryWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'developerMemoryPanel';
    
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionContext: vscode.ExtensionContext,
        private readonly memoryService: MemoryService
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionContext.extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'search':
                        this.handleSearch(message.query);
                        break;
                    case 'openMemory':
                        this.handleOpenMemory(message.memoryId);
                        break;
                    case 'deleteMemory':
                        this.handleDeleteMemory(message.memoryId);
                        break;
                    case 'refresh':
                        this.refresh();
                        break;
                    case 'capture':
                        vscode.commands.executeCommand('developerMemory.captureMemory');
                        break;
                    case 'getRecentMemories':
                        this.sendRecentMemories();
                        break;
                    case 'getStats':
                        this.sendStats();
                        break;
                }
            },
            undefined,
            this._extensionContext.subscriptions
        );

        // Load initial data
        this.sendRecentMemories();
        this.sendStats();
    }

    public show() {
        if (this._view) {
            this._view.show?.(true);
        }
    }

    public refresh() {
        if (this._view) {
            this.sendRecentMemories();
            this.sendStats();
        }
    }

    private async handleSearch(query: string) {
        try {
            const results = await this.memoryService.searchMemories(query, 10);
            this._view?.webview.postMessage({
                type: 'searchResults',
                results: results
            });
        } catch (error) {
            this._view?.webview.postMessage({
                type: 'error',
                message: `Search failed: ${error}`
            });
        }
    }

    private async handleOpenMemory(memoryId: string) {
        try {
            const memory = await this.memoryService.getMemory(memoryId);
            await vscode.commands.executeCommand('developerMemory.openMemory', memory);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open memory: ${error}`);
        }
    }

    private async handleDeleteMemory(memoryId: string) {
        const confirmation = await vscode.window.showWarningMessage(
            'Are you sure you want to delete this memory?',
            { modal: true },
            'Delete',
            'Cancel'
        );

        if (confirmation === 'Delete') {
            try {
                await this.memoryService.deleteMemory(memoryId);
                this.refresh();
                vscode.window.showInformationMessage('Memory deleted successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to delete memory: ${error}`);
            }
        }
    }

    private async sendRecentMemories() {
        try {
            const memories = await this.memoryService.getRecentMemories(10);
            this._view?.webview.postMessage({
                type: 'recentMemories',
                memories: memories
            });
        } catch (error) {
            console.error('Failed to get recent memories:', error);
        }
    }

    private async sendStats() {
        try {
            const stats = await this.memoryService.getMemoryStats();
            this._view?.webview.postMessage({
                type: 'stats',
                stats: stats
            });
        } catch (error) {
            console.error('Failed to get stats:', error);
        }
    }

    private _getHtmlForWebview(): string {
        // Return the HTML content - we'll create this in a separate file
        return this.getWebviewContent();
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Developer Memory Layer</title>
    <link rel="stylesheet" href="webview-styles.css">
</head>
<body>
    <div class="header">
        <h2>🧠 Memory Layer</h2>
        <button class="btn btn-secondary" onclick="refresh()">🔄</button>
    </div>

    <div class="search-container">
        <input type="text" class="search-input" id="searchInput" 
               placeholder="🔍 Search your memories..." onkeyup="handleSearchInput(event)" />
    </div>

    <div class="actions">
        <button class="btn" onclick="captureMemory()">💾 Capture</button>
        <button class="btn btn-secondary" onclick="showAllMemories()">📋 View All</button>
    </div>

    <div id="errorContainer"></div>

    <div class="stats" id="statsContainer">
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value" id="totalMemories">-</div>
                <div class="stat-label">Total Memories</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="totalTags">-</div>
                <div class="stat-label">Unique Tags</div>
            </div>
        </div>
        <div class="tag-cloud" id="tagCloud"></div>
    </div>

    <div class="section">
        <div class="section-title">Recent Memories</div>
        <div class="memory-list" id="recentMemories">
            <div class="loading">Loading memories...</div>
        </div>
    </div>

    <div class="section" id="searchResultsSection" style="display: none;">
        <div class="section-title">Search Results</div>
        <div class="memory-list" id="searchResults"></div>
    </div>

    <script src="webview-script.js"></script>
</body>
</html>`;
    }
}
