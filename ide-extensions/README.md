# 🧩 Developer Memory Layer - IDE Extensions

This directory contains IDE extensions that integrate with the Developer Memory Layer, allowing developers to capture insights, search knowledge, and get contextual suggestions directly from their development environment.

## 📦 Available Extensions

### 🎯 VS Code Extension (Primary)
- **Path**: `./vscode-extension/`
- **Status**: ✅ Ready for development
- **Features**: Full integration with capture, search, and contextual insights

### 🔮 Future Extensions
- **JetBrains IDEs**: IntelliJ IDEA, WebStorm, PyCharm, etc.
- **Vim/Neovim**: Plugin for terminal-based development
- **Emacs**: Package integration
- **Sublime Text**: Plugin support

## 🚀 Quick Start

### VS Code Extension
```bash
cd ide-extensions/vscode-extension
npm install
npm run compile
# Press F5 in VS Code to launch extension development host
```

## 🎯 Core Features

All IDE extensions provide:

- **📝 Memory Capture**: Quickly save code snippets, solutions, and insights
- **🔍 Smart Search**: Search your knowledge base without leaving the IDE
- **💡 Contextual Suggestions**: Get relevant memories based on current code context
- **🏷️ Automatic Tagging**: Auto-tag memories based on file type, project, and context
- **🔗 Quick Links**: Jump between related memories and code
- **📊 Usage Analytics**: Track which memories are most valuable

## 🛠️ Development

Each extension follows IDE-specific conventions while maintaining consistent core functionality through shared APIs and utilities.

See individual extension directories for specific development instructions.
