import * as vscode from 'vscode';
import { MemoryService } from './services/memoryService';
import { MemoryProvider } from './providers/memoryProvider';
import { ContextualSuggestionProvider } from './providers/contextualSuggestionProvider';
import { MemoryWebviewProvider } from './providers/memoryWebviewProvider';
import { StatusBarManager } from './managers/statusBarManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('🧠 Developer Memory Layer extension is now active!');

    // Initialize services
    const memoryService = new MemoryService();
    const memoryProvider = new MemoryProvider(memoryService);
    const contextualProvider = new ContextualSuggestionProvider(memoryService);
    const webviewProvider = new MemoryWebviewProvider(context, memoryService);
    const statusBarManager = new StatusBarManager(memoryService);

    // Register tree data provider
    vscode.window.createTreeView('developerMemoryExplorer', {
        treeDataProvider: memoryProvider,
        showCollapseAll: true
    });

    // Register webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('developerMemoryPanel', webviewProvider)
    );

    // Register commands
    const commands = [
        // Capture Memory Command
        vscode.commands.registerCommand('developerMemory.captureMemory', async () => {
            await captureMemory(memoryService);
        }),

        // Search Memories Command
        vscode.commands.registerCommand('developerMemory.searchMemories', async () => {
            await searchMemories(memoryService);
        }),

        // Show Panel Command
        vscode.commands.registerCommand('developerMemory.showPanel', () => {
            webviewProvider.show();
        }),

        // Get Contextual Suggestions Command
        vscode.commands.registerCommand('developerMemory.getContextualSuggestions', async () => {
            await getContextualSuggestions(contextualProvider);
        }),

        // Refresh Memories Command
        vscode.commands.registerCommand('developerMemory.refreshMemories', () => {
            memoryProvider.refresh();
            vscode.window.showInformationMessage('🔄 Memories refreshed!');
        }),

        // Open Memory Command (internal)
        vscode.commands.registerCommand('developerMemory.openMemory', async (memory: any) => {
            await openMemory(memory);
        })
    ];

    // Register event listeners
    const eventListeners = [
        // Auto-capture on file save (if enabled)
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            const config = vscode.workspace.getConfiguration('developerMemory');
            if (config.get<boolean>('autoCapture', false)) {
                await autoCaptureOnSave(document, memoryService);
            }
        }),

        // Contextual suggestions on cursor position change
        vscode.window.onDidChangeTextEditorSelection(async (event) => {
            const config = vscode.workspace.getConfiguration('developerMemory');
            if (config.get<boolean>('enableContextualSuggestions', true)) {
                await contextualProvider.handleSelectionChange(event);
            }
        }),

        // Update status bar on active editor change
        vscode.window.onDidChangeActiveTextEditor(() => {
            statusBarManager.updateStatusBar();
        })
    ];

    // Add all subscriptions
    context.subscriptions.push(...commands, ...eventListeners);

    // Initialize status bar
    statusBarManager.initializeStatusBar();

    // Show welcome message
    vscode.window.showInformationMessage(
        '🧠 Developer Memory Layer is ready! Press Ctrl+Shift+M to capture your first memory.',
        'Open Panel'
    ).then(selection => {
        if (selection === 'Open Panel') {
            vscode.commands.executeCommand('developerMemory.showPanel');
        }
    });
}

async function captureMemory(memoryService: MemoryService) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('📝 No active editor found. Please open a file first.');
        return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    const currentFile = editor.document.fileName;
    const currentLine = selection.start.line + 1;

    // Get title from user
    const title = await vscode.window.showInputBox({
        prompt: '💾 Enter a title for this memory',
        placeHolder: 'e.g., "React component optimization technique"',
        value: selectedText ? `Code from ${currentFile.split('/').pop()}:${currentLine}` : ''
    });

    if (!title) {
        return;
    }

    // Get description/notes from user
    const description = await vscode.window.showInputBox({
        prompt: '📝 Add description or notes (optional)',
        placeHolder: 'Explain what this code does, why it\'s useful, or lessons learned...'
    });

    // Auto-detect tags based on file type and content
    const autoTags = await memoryService.generateTags(currentFile, selectedText || editor.document.getText());
    
    // Get additional tags from user
    const tagsInput = await vscode.window.showInputBox({
        prompt: '🏷️ Add tags (comma-separated)',
        placeHolder: 'e.g., react, performance, frontend',
        value: autoTags.join(', ')
    });

    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : autoTags;

    try {
        const memory = await memoryService.createMemory({
            title,
            content: selectedText || editor.document.getText(),
            description: description || '',
            tags,
            source: {
                type: 'vscode',
                file: currentFile,
                line: currentLine,
                language: editor.document.languageId
            },
            project: vscode.workspace.name || 'Unknown'
        });

        vscode.window.showInformationMessage(`✅ Memory "${title}" captured successfully!`);
        
        // Refresh the tree view
        vscode.commands.executeCommand('developerMemory.refreshMemories');
        
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to capture memory: ${error}`);
    }
}

async function searchMemories(memoryService: MemoryService) {
    const query = await vscode.window.showInputBox({
        prompt: '🔍 Search your memories',
        placeHolder: 'e.g., "react hooks", "authentication", "database optimization"'
    });

    if (!query) {
        return;
    }

    try {
        const results = await memoryService.searchMemories(query);
        
        if (results.length === 0) {
            vscode.window.showInformationMessage('🔍 No memories found for your search.');
            return;
        }

        // Show results in quick pick
        const items = results.map(memory => ({
            label: `💡 ${memory.title}`,
            description: memory.description,
            detail: `Tags: ${memory.tags.join(', ')} | ${memory.createdAt}`,
            memory
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Found ${results.length} memories. Select one to open.`,
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            await openMemory(selected.memory);
        }

    } catch (error) {
        vscode.window.showErrorMessage(`❌ Search failed: ${error}`);
    }
}

async function getContextualSuggestions(contextualProvider: ContextualSuggestionProvider) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('📝 No active editor found.');
        return;
    }

    try {
        const suggestions = await contextualProvider.getSuggestions(editor);
        
        if (suggestions.length === 0) {
            vscode.window.showInformationMessage('💡 No contextual suggestions found for current code.');
            return;
        }

        // Show suggestions in quick pick
        const items = suggestions.map(suggestion => ({
            label: `💡 ${suggestion.title}`,
            description: `Relevance: ${(suggestion.relevance * 100).toFixed(0)}%`,
            detail: suggestion.reason,
            suggestion
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Found ${suggestions.length} relevant memories. Select one to open.`,
            matchOnDescription: true
        });

        if (selected) {
            await openMemory(selected.suggestion);
        }

    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to get suggestions: ${error}`);
    }
}

async function openMemory(memory: any) {
    // Create a new untitled document with the memory content
    const document = await vscode.workspace.openTextDocument({
        content: `# ${memory.title}\n\n${memory.description ? memory.description + '\n\n' : ''}## Code\n\n\`\`\`${memory.source?.language || 'text'}\n${memory.content}\n\`\`\`\n\n## Tags\n${memory.tags.map((tag: string) => `- ${tag}`).join('\n')}\n\n## Source\n${memory.source?.file || 'Unknown'} (Line ${memory.source?.line || 'Unknown'})\n\n## Created\n${memory.createdAt}`,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(document);
}

async function autoCaptureOnSave(document: vscode.TextDocument, memoryService: MemoryService) {
    // Only auto-capture for code files (not config, markdown, etc.)
    const codeLanguages = ['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust', 'php'];
    
    if (!codeLanguages.includes(document.languageId)) {
        return;
    }

    // Check if file has significant changes (basic heuristic)
    const content = document.getText();
    if (content.length < 100) { // Skip very small files
        return;
    }

    try {
        // Auto-generate title and tags
        const fileName = document.fileName.split('/').pop() || 'Unknown';
        const title = `Auto-captured: ${fileName}`;
        const tags = await memoryService.generateTags(document.fileName, content);

        await memoryService.createMemory({
            title,
            content,
            description: `Automatically captured on save from ${fileName}`,
            tags: [...tags, 'auto-captured'],
            source: {
                type: 'vscode-auto',
                file: document.fileName,
                language: document.languageId
            },
            project: vscode.workspace.name || 'Unknown'
        });

        // Show subtle notification
        vscode.window.setStatusBarMessage('💾 Memory auto-captured', 3000);

    } catch (error) {
        console.error('Auto-capture failed:', error);
    }
}

export function deactivate() {
    console.log('🧠 Developer Memory Layer extension deactivated');
}
