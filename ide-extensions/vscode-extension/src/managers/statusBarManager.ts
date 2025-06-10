import * as vscode from 'vscode';
import { MemoryService } from '../services/memoryService';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private isConnected = false;

    constructor(private memoryService: MemoryService) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
    }

    public initializeStatusBar(): void {
        this.statusBarItem.command = 'developerMemory.showPanel';
        this.statusBarItem.show();
        this.updateStatusBar();
        
        // Check connection status periodically
        this.checkConnection();
        setInterval(() => this.checkConnection(), 30000); // Check every 30 seconds
    }

    public updateStatusBar(): void {
        if (this.isConnected) {
            this.statusBarItem.text = "$(brain) Memory Layer";
            this.statusBarItem.tooltip = "Developer Memory Layer - Connected\nClick to open panel";
            this.statusBarItem.backgroundColor = undefined;
        } else {
            this.statusBarItem.text = "$(warning) Memory Layer";
            this.statusBarItem.tooltip = "Developer Memory Layer - Disconnected\nClick to retry connection";
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    }

    private async checkConnection(): Promise<void> {
        try {
            const connected = await this.memoryService.testConnection();
            if (connected !== this.isConnected) {
                this.isConnected = connected;
                this.updateStatusBar();
                
                if (connected) {
                    vscode.window.setStatusBarMessage('$(check) Memory Layer connected', 3000);
                } else {
                    vscode.window.setStatusBarMessage('$(warning) Memory Layer disconnected', 5000);
                }
            }
        } catch (error) {
            if (this.isConnected) {
                this.isConnected = false;
                this.updateStatusBar();
            }
        }
    }

    public showMessage(message: string, duration: number = 3000): void {
        vscode.window.setStatusBarMessage(message, duration);
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
