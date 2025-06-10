# 🧩 VS Code Extension for Developer Memory Layer

This VS Code extension integrates the Developer Memory Layer directly into your IDE, allowing you to capture insights, search your knowledge base, and get contextual suggestions while coding.

## ✨ Features

### 📝 **Memory Capture**
- **Quick Capture**: Press `Ctrl+Shift+M` to capture selected code or current context
- **Auto-Tagging**: Intelligent tag generation based on file type and content
- **Context Awareness**: Automatically captures file location, line numbers, and project info

### 🔍 **Smart Search**
- **Semantic Search**: Find memories by meaning, not just keywords
- **Quick Search**: Press `Ctrl+Shift+F` to search your entire knowledge base
- **Contextual Results**: Results ranked by relevance to your current work

### 💡 **Contextual Suggestions**
- **Auto-Suggestions**: Get relevant memories based on your current code context
- **Intent Recognition**: AI understands what you're working on and suggests related insights
- **Non-Intrusive**: Subtle notifications that don't interrupt your flow

### 📊 **Memory Explorer**
- **Tree View**: Browse memories organized by date, tags, or projects
- **Quick Actions**: Capture, search, and manage memories from the sidebar
- **Stats Dashboard**: Track your knowledge accumulation over time

## 🚀 Getting Started

### Prerequisites
- VS Code 1.74.0 or later
- Developer Memory Layer backend running (see main project README)

### Installation

#### From Source (Development)
```bash
# Clone the repository
git clone https://github.com/vosbek/developer-memory-layer.git
cd developer-memory-layer/ide-extensions/vscode-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Open in VS Code and press F5 to launch Extension Development Host
code .
```

#### From VSIX Package
```bash
# Build the extension package
npm run package

# Install the .vsix file
code --install-extension developer-memory-layer-1.0.0.vsix
```

### Configuration

Open VS Code settings and configure the extension:

```json
{
  "developerMemory.apiUrl": "http://localhost:4000",
  "developerMemory.autoCapture": false,
  "developerMemory.enableContextualSuggestions": true,
  "developerMemory.suggestionTriggerDelay": 2000,
  "developerMemory.maxResults": 10
}
```

## 🎯 Usage

### Capturing Memories

1. **Manual Capture**:
   - Select code or place cursor in relevant context
   - Press `Ctrl+Shift+M` or use Command Palette: "Memory Layer: Capture Memory"
   - Add title, description, and tags
   - Memory is automatically tagged based on context

2. **Auto Capture** (Optional):
   - Enable `developerMemory.autoCapture` in settings
   - Memories are automatically captured when you save files

### Searching Memories

1. **Quick Search**:
   - Press `Ctrl+Shift+F` or use Command Palette: "Memory Layer: Search Memories"
   - Type your query using natural language
   - Select from results to open in new tab

2. **Panel Search**:
   - Open Memory Layer panel from sidebar
   - Use search box for persistent search interface
   - Browse by tags, projects, or dates

### Getting Suggestions

1. **Automatic**:
   - Suggestions appear as you code (if enabled)
   - Click notification to view relevant memories

2. **Manual**:
   - Press `Ctrl+Shift+I` or use Command Palette: "Memory Layer: Get Suggestions"
   - View contextually relevant memories for current code

## ⚙️ Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Memory Layer: Capture Memory` | `Ctrl+Shift+M` | Capture current selection or context |
| `Memory Layer: Search Memories` | `Ctrl+Shift+F` | Search your knowledge base |
| `Memory Layer: Get Suggestions` | `Ctrl+Shift+I` | Get contextual suggestions |
| `Memory Layer: Show Panel` | - | Open Memory Layer panel |
| `Memory Layer: Refresh Memories` | - | Refresh memory list |

## 🛠️ Development

### Project Structure
```
src/
├── extension.ts              # Main extension entry point
├── services/
│   └── memoryService.ts      # API communication service
├── providers/
│   ├── memoryProvider.ts     # Tree view data provider
│   ├── contextualSuggestionProvider.ts  # AI suggestions
│   └── memoryWebviewProvider.ts  # Panel webview
└── managers/
    └── statusBarManager.ts   # Status bar integration
```

### Building
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch

# Run tests
npm test

# Package extension
npm run package
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Manual testing
# Press F5 in VS Code to launch Extension Development Host
```

## 📚 API Integration

The extension communicates with the Developer Memory Layer backend through REST APIs:

### Endpoints Used
- `GET /api/health` - Connection health check
- `GET /api/memories` - Fetch memories
- `POST /api/memories` - Create new memory
- `GET /api/memories/search` - Search memories
- `POST /api/memories/contextual` - Get contextual suggestions
- `POST /api/memories/generate-tags` - Auto-generate tags

### Authentication
Currently supports unauthenticated access. JWT token support planned for future releases.

## 🔧 Configuration Options

### Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `apiUrl` | string | `http://localhost:4000` | Memory Layer API endpoint |
| `autoCapture` | boolean | `false` | Auto-capture on file save |
| `showExplorer` | boolean | `true` | Show explorer panel |
| `maxResults` | number | `10` | Max search results |
| `enableContextualSuggestions` | boolean | `true` | Enable auto-suggestions |
| `suggestionTriggerDelay` | number | `2000` | Suggestion delay (ms) |

### Keyboard Shortcuts

All shortcuts can be customized in VS Code's Keyboard Shortcuts settings (`Ctrl+K Ctrl+S`).

## 🐛 Troubleshooting

### Common Issues

**Extension not connecting to API**
- Verify Developer Memory Layer backend is running
- Check `apiUrl` setting matches your backend URL
- Look for connection status in status bar

**No suggestions appearing**
- Enable `enableContextualSuggestions` setting
- Adjust `suggestionTriggerDelay` for faster/slower suggestions
- Check console for error messages

**Search not working**
- Verify backend search service is running
- Check network connectivity
- Try simpler search terms

### Debug Mode

1. Open VS Code Developer Tools: `Help > Toggle Developer Tools`
2. Check Console tab for extension logs
3. Enable verbose logging in extension settings

### Support

- GitHub Issues: [Report bugs and request features](https://github.com/vosbek/developer-memory-layer/issues)
- Documentation: [Main project docs](../../README.md)
- API Reference: [Backend API docs](../../docs/api.md)

## 🗺️ Roadmap

### Version 1.1
- [ ] **Authentication Support**: JWT token integration
- [ ] **Offline Mode**: Local caching for offline access
- [ ] **Team Sharing**: Share memories with team members
- [ ] **Export/Import**: Backup and restore memories

### Version 1.2
- [ ] **AI Enhancements**: Better contextual understanding
- [ ] **Custom Tags**: User-defined tag categories
- [ ] **Memory Templates**: Predefined memory structures
- [ ] **Integration Expansion**: More IDE and tool integrations

### Version 2.0
- [ ] **Real-time Collaboration**: Live memory sharing
- [ ] **Advanced Analytics**: Usage insights and patterns
- [ ] **Plugin System**: Extensible architecture
- [ ] **Mobile Companion**: Mobile app integration

## 📄 License

This extension is part of the Developer Memory Layer project and is licensed under the MIT License.

## 🙏 Contributing

Contributions are welcome! Please see the [contributing guide](../../CONTRIBUTING.md) for details.

---

**💡 Pro Tip**: Start by capturing a few memories manually to build up your knowledge base, then enable auto-suggestions to see the magic happen!
