import * as vscode from 'vscode';
import { MemoryService, SearchResult } from '../services/memoryService';

export class ContextualSuggestionProvider {
    private lastSuggestionTime = 0;
    private currentSuggestions: SearchResult[] = [];
    private suggestionTimeout: NodeJS.Timeout | undefined;

    constructor(private memoryService: MemoryService) {}

    async handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): Promise<void> {
        const config = vscode.workspace.getConfiguration('developerMemory');
        const delay = config.get<number>('suggestionTriggerDelay', 2000);
        
        // Clear previous timeout
        if (this.suggestionTimeout) {
            clearTimeout(this.suggestionTimeout);
        }

        // Set new timeout for suggestions
        this.suggestionTimeout = setTimeout(async () => {
            await this.showContextualSuggestions(event.textEditor);
        }, delay);
    }

    async getSuggestions(editor: vscode.TextEditor): Promise<SearchResult[]> {
        const document = editor.document;
        const selection = editor.selection;
        
        // Get context around current cursor/selection
        const context = this.getContext(document, selection);
        
        if (!context.content.trim()) {
            return [];
        }

        try {
            const suggestions = await this.memoryService.getContextualSuggestions(
                context.content,
                document.languageId,
                document.fileName,
                5
            );

            // Filter and enhance suggestions based on current context
            return this.enhanceSuggestions(suggestions, context);
        } catch (error) {
            console.error('Failed to get contextual suggestions:', error);
            return [];
        }
    }

    private async showContextualSuggestions(editor: vscode.TextEditor): Promise<void> {
        const now = Date.now();
        
        // Rate limiting - don't show suggestions too frequently
        if (now - this.lastSuggestionTime < 1000) {
            return;
        }

        const suggestions = await this.getSuggestions(editor);
        
        if (suggestions.length === 0) {
            return;
        }

        this.currentSuggestions = suggestions;
        this.lastSuggestionTime = now;

        // Show subtle notification with the most relevant suggestion
        const topSuggestion = suggestions[0];
        const message = `💡 Found relevant memory: "${topSuggestion.title}" (${Math.round(topSuggestion.relevance * 100)}% match)`;
        
        const action = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            'View',
            'View All',
            'Dismiss'
        );

        switch (action) {
            case 'View':
                await vscode.commands.executeCommand('developerMemory.openMemory', topSuggestion);
                break;
            case 'View All':
                await this.showSuggestionQuickPick(suggestions);
                break;
        }
    }

    private async showSuggestionQuickPick(suggestions: SearchResult[]): Promise<void> {
        const items = suggestions.map(suggestion => ({
            label: `💡 ${suggestion.title}`,
            description: `${Math.round(suggestion.relevance * 100)}% relevant`,
            detail: suggestion.reason || suggestion.description,
            suggestion
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a contextual memory to view',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            await vscode.commands.executeCommand('developerMemory.openMemory', selected.suggestion);
        }
    }

    private getContext(document: vscode.TextDocument, selection: vscode.Selection): ContextInfo {
        const currentLine = selection.active.line;
        const totalLines = document.lineCount;
        
        // Define context window size
        const contextRadius = 10; // lines above and below
        const startLine = Math.max(0, currentLine - contextRadius);
        const endLine = Math.min(totalLines - 1, currentLine + contextRadius);

        // Get the context content
        const contextRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
        const content = document.getText(contextRange);

        // Get selected text if any
        const selectedText = document.getText(selection);

        // Analyze the context
        const analysis = this.analyzeContext(document, content, selectedText, currentLine);

        return {
            content: selectedText || content,
            selectedText,
            fullContext: content,
            currentLine,
            fileName: document.fileName,
            language: document.languageId,
            analysis
        };
    }

    private analyzeContext(
        document: vscode.TextDocument, 
        content: string, 
        selectedText: string, 
        currentLine: number
    ): ContextAnalysis {
        const line = document.lineAt(currentLine).text;
        const contentLower = content.toLowerCase();
        
        // Detect patterns and context
        const patterns = {
            // Function/method context
            isFunction: /function\s+\w+|const\s+\w+\s*=|def\s+\w+|class\s+\w+/i.test(line),
            isMethod: /\.\w+\(|\w+\s*\(/i.test(line),
            
            // Error handling
            isErrorHandling: /try|catch|except|error|throw/i.test(contentLower),
            
            // API/HTTP
            isApiCall: /fetch|axios|http|api|endpoint|request/i.test(contentLower),
            
            // Database
            isDatabase: /select|insert|update|delete|query|sql/i.test(contentLower),
            
            // Testing
            isTesting: /test|spec|describe|it\(|expect/i.test(contentLower),
            
            // Authentication
            isAuth: /auth|login|token|jwt|password|session/i.test(contentLower),
            
            // Performance
            isPerformance: /optimize|performance|cache|speed|async|await/i.test(contentLower),
            
            // UI/Frontend
            isUI: /component|render|usestate|useeffect|onclick|event/i.test(contentLower),
            
            // Configuration
            isConfig: /config|setting|env|environment|variable/i.test(contentLower)
        };

        // Extract keywords and identifiers
        const keywords = this.extractKeywords(content);
        const identifiers = this.extractIdentifiers(content, document.languageId);

        return {
            patterns,
            keywords,
            identifiers,
            complexity: this.calculateComplexity(content),
            intent: this.detectIntent(patterns, keywords)
        };
    }

    private extractKeywords(content: string): string[] {
        // Common programming keywords and concepts
        const programmingKeywords = [
            'function', 'class', 'method', 'variable', 'array', 'object', 'string', 'number',
            'async', 'await', 'promise', 'callback', 'event', 'handler', 'listener',
            'component', 'service', 'controller', 'model', 'view', 'router',
            'database', 'query', 'api', 'endpoint', 'request', 'response',
            'authentication', 'authorization', 'security', 'encryption',
            'optimization', 'performance', 'cache', 'memory', 'algorithm',
            'testing', 'debugging', 'logging', 'monitoring', 'error'
        ];

        const contentLower = content.toLowerCase();
        return programmingKeywords.filter(keyword => 
            contentLower.includes(keyword)
        );
    }

    private extractIdentifiers(content: string, language: string): string[] {
        // Extract likely variable/function names based on language
        let identifierPattern: RegExp;
        
        switch (language) {
            case 'javascript':
            case 'typescript':
                identifierPattern = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
                break;
            case 'python':
                identifierPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
                break;
            case 'java':
            case 'csharp':
                identifierPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
                break;
            default:
                identifierPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
        }

        const matches = content.match(identifierPattern) || [];
        
        // Filter out common keywords and short identifiers
        const commonKeywords = ['if', 'else', 'for', 'while', 'do', 'try', 'catch', 'class', 'function', 'var', 'let', 'const'];
        
        return [...new Set(matches)]
            .filter(id => id.length > 2 && !commonKeywords.includes(id.toLowerCase()))
            .slice(0, 10); // Limit to avoid noise
    }

    private calculateComplexity(content: string): 'low' | 'medium' | 'high' {
        const lines = content.split('\n').length;
        const conditions = (content.match(/if|else|switch|case|while|for/g) || []).length;
        const functions = (content.match(/function|def|class|\=\>/g) || []).length;
        
        const complexity = lines + (conditions * 2) + (functions * 3);
        
        if (complexity < 20) return 'low';
        if (complexity < 50) return 'medium';
        return 'high';
    }

    private detectIntent(patterns: any, keywords: string[]): string[] {
        const intents: string[] = [];
        
        if (patterns.isFunction) intents.push('function-definition');
        if (patterns.isMethod) intents.push('method-call');
        if (patterns.isErrorHandling) intents.push('error-handling');
        if (patterns.isApiCall) intents.push('api-integration');
        if (patterns.isDatabase) intents.push('data-persistence');
        if (patterns.isTesting) intents.push('testing');
        if (patterns.isAuth) intents.push('authentication');
        if (patterns.isPerformance) intents.push('optimization');
        if (patterns.isUI) intents.push('user-interface');
        if (patterns.isConfig) intents.push('configuration');
        
        // Add intent based on keywords
        if (keywords.includes('algorithm')) intents.push('algorithm');
        if (keywords.includes('security')) intents.push('security');
        if (keywords.includes('performance')) intents.push('performance');
        
        return intents;
    }

    private enhanceSuggestions(suggestions: SearchResult[], context: ContextInfo): SearchResult[] {
        return suggestions.map(suggestion => {
            let enhancedRelevance = suggestion.relevance;
            let enhancedReason = suggestion.reason || 'Similar content found';

            // Boost relevance based on context analysis
            if (context.analysis.intent.length > 0) {
                const matchingIntents = context.analysis.intent.filter(intent => 
                    suggestion.tags.some(tag => tag.includes(intent.replace('-', '')))
                );
                
                if (matchingIntents.length > 0) {
                    enhancedRelevance += 0.1;
                    enhancedReason = `Intent match: ${matchingIntents.join(', ')}`;
                }
            }

            // Boost for same language
            if (suggestion.source?.language === context.language) {
                enhancedRelevance += 0.05;
            }

            // Boost for matching keywords
            const matchingKeywords = context.analysis.keywords.filter(keyword =>
                suggestion.content.toLowerCase().includes(keyword) ||
                suggestion.tags.some(tag => tag.includes(keyword))
            );

            if (matchingKeywords.length > 0) {
                enhancedRelevance += matchingKeywords.length * 0.02;
                enhancedReason += ` (Keywords: ${matchingKeywords.slice(0, 3).join(', ')})`;
            }

            // Boost for matching identifiers
            const matchingIdentifiers = context.analysis.identifiers.filter(identifier =>
                suggestion.content.includes(identifier)
            );

            if (matchingIdentifiers.length > 0) {
                enhancedRelevance += matchingIdentifiers.length * 0.03;
                enhancedReason += ` (Identifiers: ${matchingIdentifiers.slice(0, 2).join(', ')})`;
            }

            return {
                ...suggestion,
                relevance: Math.min(1.0, enhancedRelevance), // Cap at 1.0
                reason: enhancedReason
            };
        }).sort((a, b) => b.relevance - a.relevance);
    }

    // Public methods for manual triggering
    async showManualSuggestions(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found.');
            return;
        }

        const suggestions = await this.getSuggestions(editor);
        if (suggestions.length === 0) {
            vscode.window.showInformationMessage('No contextual suggestions found for current code.');
            return;
        }

        await this.showSuggestionQuickPick(suggestions);
    }

    // Clear current suggestions
    clearSuggestions(): void {
        this.currentSuggestions = [];
        if (this.suggestionTimeout) {
            clearTimeout(this.suggestionTimeout);
            this.suggestionTimeout = undefined;
        }
    }

    // Get current suggestions for external use
    getCurrentSuggestions(): SearchResult[] {
        return this.currentSuggestions;
    }
}

// Type definitions
interface ContextInfo {
    content: string;
    selectedText: string;
    fullContext: string;
    currentLine: number;
    fileName: string;
    language: string;
    analysis: ContextAnalysis;
}

interface ContextAnalysis {
    patterns: {
        isFunction: boolean;
        isMethod: boolean;
        isErrorHandling: boolean;
        isApiCall: boolean;
        isDatabase: boolean;
        isTesting: boolean;
        isAuth: boolean;
        isPerformance: boolean;
        isUI: boolean;
        isConfig: boolean;
    };
    keywords: string[];
    identifiers: string[];
    complexity: 'low' | 'medium' | 'high';
    intent: string[];
}
