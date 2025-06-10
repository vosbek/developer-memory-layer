# 🧠 Developer Memory Layer

> **A smart knowledge management system that captures, organizes, and surfaces your development insights across tools and time.**

[![Podman Ready](https://img.shields.io/badge/Podman-Ready-brightgreen?logo=podman)](./PODMAN-SETUP.md)
[![Docker Compatible](https://img.shields.io/badge/Docker-Compatible-blue?logo=docker)](./SETUP.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

## 🚀 Quick Start (Podman - Recommended)

```bash
# Clone and start with Podman (secure, rootless containers)
git clone https://github.com/vosbek/developer-memory-layer.git
cd developer-memory-layer
cp .env.example .env
podman-compose -f podman-compose.yml up -d

# Your app is now running at:
# 🌐 Frontend: http://localhost:3000
# 🔧 API: http://localhost:4000  
# 📊 Admin: http://localhost:5050
```

### 🔄 Migrating from Docker?

We've made it super easy! Just run our migration script:

```bash
chmod +x migrate-to-podman.sh
./migrate-to-podman.sh
```

This script will automatically backup your Docker data, install Podman dependencies, and migrate everything seamlessly.

## ✨ What is Developer Memory Layer?

Ever struggled to remember that perfect solution you implemented months ago? Or wished you could quickly find that specific discussion from a team meeting? Developer Memory Layer is your personal AI-powered assistant that:

- **🔍 Captures Everything**: Automatically ingests data from GitHub, Slack, Jira, emails, and documents
- **🧠 Smart Search**: Uses AI embeddings to find information based on intent, not just keywords  
- **💡 Surfaces Insights**: Proactively suggests relevant past solutions and discussions
- **🤝 Learns Patterns**: Understands your workflow and surfaces information when you need it
- **🔒 Privacy-First**: Self-hosted solution that keeps your data under your control

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │ Integration     │
│   (React)       │────│   (Node.js)     │────│ Services        │
│   Port: 3000    │    │   Port: 4000    │    │ (GitHub, Slack) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌─────────────────┐    ┌─────────────────┐
                    │ Memory Service  │    │ Search Service  │
                    │ (CRUD Ops)      │    │ (AI/Vector)     │
                    │ Port: 4001      │    │ Port: 4002      │
                    └─────────────────┘    └─────────────────┘
                                │
                    ┌─────────────────┐    ┌─────────────────┐
                    │  PostgreSQL     │    │     Redis       │
                    │  (Database)     │    │   (Cache)       │
                    │  Port: 5432     │    │  Port: 6379     │
                    └─────────────────┘    └─────────────────┘
```

## 🎯 Features

### Core Memory Management
- **📝 Memory Capture**: Create, edit, and organize development insights
- **🏷️ Smart Tagging**: Automatic categorization with manual override
- **🔗 Relationship Mapping**: Connect related memories and concepts
- **📈 Timeline View**: See how your knowledge evolves over time

### AI-Powered Search  
- **🤖 Semantic Search**: Find information by meaning, not just keywords
- **💬 Natural Language**: Ask questions like "How did we handle authentication in the mobile app?"
- **🎯 Context-Aware**: Results consider your current project and recent activity
- **📊 Relevance Scoring**: Smart ranking based on recency, importance, and context

### External Integrations
- **🐙 GitHub**: Pull requests, issues, code comments, discussions
- **💬 Slack**: Messages, threads, shared files, reactions
- **🎫 Jira**: Tickets, comments, status changes, sprint data  
- **📧 Microsoft 365**: Emails, calendar events, document collaboration
- **📁 File Systems**: Local documents, shared drives, wikis

### Team Collaboration
- **👥 Shared Knowledge**: Team-wide memory pools with access controls
- **🔄 Real-time Sync**: Live updates across team members
- **📊 Analytics Dashboard**: Track knowledge sharing and usage patterns
- **🎯 Smart Recommendations**: Get suggestions based on team activity

## 🛠️ Installation Options

### Option 1: Podman (Recommended) ⭐

**Why Podman?**
- ✅ **Rootless containers** - Better security by default
- ✅ **No daemon** - Direct container execution  
- ✅ **Drop-in replacement** - Same commands as Docker
- ✅ **Systemd integration** - Native service management
- ✅ **Kubernetes compatible** - Generate K8s YAML directly

```bash
# Install Podman (if not already installed)
# macOS
brew install podman

# Ubuntu/Debian
sudo apt-get install podman

# RHEL/CentOS/Fedora  
sudo dnf install podman

# Start the application
git clone https://github.com/vosbek/developer-memory-layer.git
cd developer-memory-layer
cp .env.example .env
podman-compose -f podman-compose.yml up -d
```

**📖 [Full Podman Setup Guide](./PODMAN-SETUP.md)**

### Option 2: Docker (Legacy Support)

```bash
git clone https://github.com/vosbek/developer-memory-layer.git
cd developer-memory-layer
cp .env.example .env
docker-compose up -d
```

**📖 [Docker Setup Guide](./SETUP.md)**

### Option 3: Local Development

```bash
git clone https://github.com/vosbek/developer-memory-layer.git
cd developer-memory-layer
npm install
npm run dev:all
```

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/memory_layer
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment

# External Integrations
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
MICROSOFT_CLIENT_ID=your_azure_app_id
MICROSOFT_CLIENT_SECRET=your_azure_app_secret
JIRA_API_TOKEN=your_jira_api_token

# Application Settings
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Quick Configuration Commands

```bash
# Use our utility script for easy management
chmod +x scripts/podman-utils.sh

# Start services
./scripts/podman-utils.sh start

# Check health
./scripts/podman-utils.sh health

# View logs
./scripts/podman-utils.sh logs

# Open database shell
./scripts/podman-utils.sh db

# Create backup
./scripts/podman-utils.sh backup
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[PODMAN-SETUP.md](./PODMAN-SETUP.md)** | Comprehensive Podman setup and troubleshooting |
| **[SETUP.md](./SETUP.md)** | General setup guide with Docker fallback |
| **[API Documentation](./docs/api.md)** | REST API reference and examples |
| **[Integration Guide](./docs/integrations.md)** | Setting up external tool connections |
| **[Deployment Guide](./docs/deployment.md)** | Production deployment strategies |
| **[Contributing](./CONTRIBUTING.md)** | How to contribute to the project |

## 🚀 Usage Examples

### Basic Memory Management

```bash
# Create a new memory via API
curl -X POST http://localhost:4000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "title": "React Performance Optimization",
    "content": "Used React.memo and useMemo to optimize component re-renders...",
    "tags": ["react", "performance", "frontend"],
    "project": "web-app"
  }'

# Search memories
curl "http://localhost:4000/api/memories/search?q=react%20performance"
```

### AI-Powered Search

```bash
# Natural language search
curl "http://localhost:4000/api/search?q=how%20to%20handle%20authentication"

# Semantic similarity search
curl "http://localhost:4000/api/search/similar" \
  -H "Content-Type: application/json" \
  -d '{"text": "implementing user login system"}'
```

## 🔄 Common Tasks

### Daily Development Workflow

```bash
# Morning: Start your memory layer
./scripts/podman-utils.sh start

# During development: Capture insights
# Use the web interface at http://localhost:3000

# End of day: Create backup
./scripts/podman-utils.sh backup

# Weekend: Update and maintain
./scripts/podman-utils.sh build
./scripts/podman-utils.sh restart
```

### Team Setup

```bash
# Deploy to shared server
git clone https://github.com/vosbek/developer-memory-layer.git
cd developer-memory-layer

# Configure for production
cp .env.example .env.production
# Edit .env.production with production settings

# Start with production config
podman-compose -f podman-compose.yml --env-file .env.production up -d

# Set up systemd service for auto-start
./scripts/podman-utils.sh generate-k8s
```

## 🐛 Troubleshooting

### Common Issues

**🔴 Services won't start**
```bash
# Check container status
./scripts/podman-utils.sh status

# View detailed logs
./scripts/podman-utils.sh logs

# Reset everything
./scripts/podman-utils.sh reset
```

**🔴 Database connection issues**
```bash
# Check database health
./scripts/podman-utils.sh db

# Reset database
podman-compose -f podman-compose.yml down -v
podman-compose -f podman-compose.yml up -d
```

**🔴 Migration from Docker issues**
```bash
# Run migration script with debug output
DEBUG=1 ./migrate-to-podman.sh

# Manual migration steps in PODMAN-SETUP.md
```

### Performance Optimization

```bash
# Monitor resource usage
./scripts/podman-utils.sh monitor

# Optimize database
./scripts/podman-utils.sh db
# Run: VACUUM ANALYZE;

# Check service health
./scripts/podman-utils.sh health
```

## 🤝 Contributing

We welcome contributions! Here are some ways you can help:

- **🐛 Bug Reports**: Found an issue? [Open an issue](https://github.com/vosbek/developer-memory-layer/issues)
- **💡 Feature Requests**: Have an idea? [Start a discussion](https://github.com/vosbek/developer-memory-layer/discussions)
- **🔧 Code Contributions**: Check our [Contributing Guide](./CONTRIBUTING.md)
- **📚 Documentation**: Help improve our docs and guides
- **🧪 Testing**: Test new features and report feedback

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/developer-memory-layer.git
cd developer-memory-layer

# Create a feature branch
git checkout -b feature/your-awesome-feature

# Start development environment
./scripts/podman-utils.sh start

# Make your changes and test
./scripts/podman-utils.sh build
./scripts/podman-utils.sh health

# Submit a pull request
git push origin feature/your-awesome-feature
```

## 📊 Roadmap

### Version 2.0 (Coming Soon)
- **🔄 Real-time Collaboration**: Live editing and sharing
- **📱 Mobile App**: iOS and Android clients
- **🤖 Advanced AI**: GPT-4 integration for smart suggestions
- **📈 Analytics**: Detailed usage and knowledge metrics
- **🔐 Enterprise SSO**: SAML, LDAP integration

### Version 2.1
- **🌐 Multi-language Support**: i18n for global teams
- **🎨 Custom Themes**: Personalized UI experiences
- **📊 Advanced Dashboards**: Power BI integration
- **🔌 Plugin System**: Extensible architecture

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Podman Team** - For creating an excellent Docker alternative
- **OpenAI** - For powerful AI capabilities
- **Contributors** - Everyone who helps make this project better
- **Community** - Users who provide feedback and support

---

**💡 Pro Tip**: Start with the Podman setup for better security and performance. The migration from Docker is seamless with our automated script!

**🆘 Need Help?** 
- 📖 Check our [documentation](./docs/)
- 💬 Join our [Discord community](#) (coming soon)
- 🐛 [Report issues](https://github.com/vosbek/developer-memory-layer/issues)
- 💡 [Request features](https://github.com/vosbek/developer-memory-layer/discussions)
