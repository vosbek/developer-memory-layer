# 🚀 Developer Memory Layer - Setup Guide

## Quick Start (Individual Developer)

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Podman & Podman Compose** - [Installation guide](https://podman.io/getting-started/installation) ⭐ **Recommended**
- **Git** - [Download here](https://git-scm.com/)

> **Why Podman?** Podman offers better security with rootless containers, no daemon dependency, and seamless Docker compatibility. [Learn more](./PODMAN-SETUP.md)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/vosbek/developer-memory-layer.git
cd developer-memory-layer

# Copy environment file
cp .env.example .env

# Edit your environment variables
# Add your API keys for integrations (optional for basic usage)
nano .env
```

### 2. Run with Podman (Recommended)

```bash
# Start all services with Podman
podman-compose -f podman-compose.yml up -d

# Check status
podman-compose -f podman-compose.yml ps

# View logs
podman-compose -f podman-compose.yml logs -f

# Stop services
podman-compose -f podman-compose.yml down
```

**🎉 That's it!** Your app will be running at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Database Admin**: http://localhost:5050 (admin@example.com / admin)

### 3. Alternative: Docker (Legacy Support)

```bash
# Start all services with Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Alternative: Local Development

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend/api-gateway && npm install
cd ../memory-service && npm install
cd ../search-service && npm install
cd ../integration-service && npm install

# Start services
npm run dev:all
```

## Team Setup (2-5 Developers)

### Architecture for Teams
- **Shared PostgreSQL database** with user isolation
- **Team-based memory sharing**
- **Basic authentication** with JWT tokens
- **Real-time collaboration** via WebSockets

### Setup Steps

1. **Deploy to shared server** (AWS EC2, DigitalOcean, etc.)
2. **Configure team authentication**
3. **Set up external integrations** (GitHub, Jira, M365)
4. **Configure backup and monitoring**

### Team Environment Variables

```bash
# .env for team deployment
DATABASE_URL=postgresql://user:password@your-db-host:5432/memory_layer
REDIS_URL=redis://your-redis-host:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-domain.com

# External Integrations
GITHUB_CLIENT_ID=your_github_app_id
GITHUB_CLIENT_SECRET=your_github_app_secret
MICROSOFT_CLIENT_ID=your_azure_app_id
MICROSOFT_CLIENT_SECRET=your_azure_app_secret
JIRA_API_TOKEN=your_jira_token

# AI Services
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_pinecone_env
```

## Company-Wide Deployment (Enterprise)

### Architecture for Enterprise
- **Kubernetes orchestration** (using Podman-generated YAML)
- **Multi-tenant architecture**
- **Enterprise SSO integration** (SAML, OAuth)
- **Advanced analytics and insights**
- **High availability and scalability**

### Enterprise Features
- **Department-level organization**
- **Advanced security and compliance**
- **Knowledge analytics dashboard**
- **API rate limiting and monitoring**
- **Audit logging and GDPR compliance**

### Kubernetes Deployment with Podman

```bash
# Generate Kubernetes YAML from Podman
podman generate kube memory-layer-pod > k8s/memory-layer.yaml

# Deploy to Kubernetes cluster
kubectl apply -f k8s/memory-layer.yaml

# Monitor deployment
kubectl get pods -n memory-layer

# Scale services
kubectl scale deployment api-gateway --replicas=3 -n memory-layer
```

## Available Services

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React application |
| API Gateway | 4000 | Main API endpoint |
| Memory Service | 4001 | Memory CRUD operations |
| Search Service | 4002 | Vector embeddings & search |
| Integration Service | 4003 | External tool integrations |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching and sessions |
| pgAdmin | 5050 | Database management |

## Development Workflow

### Adding New Features

```bash
# Create feature branch
git checkout -b feature/new-awesome-feature

# Make changes to relevant service
cd backend/memory-service  # or whichever service

# Test locally
npm test

# Test integration with Podman
podman-compose -f podman-compose.yml up --build

# Commit and push
git add .
git commit -m "Add awesome new feature"
git push origin feature/new-awesome-feature
```

### Database Migrations

```bash
# Create new migration
cd backend/database
./create-migration.sh "add_new_table"

# Apply migrations with Podman
podman-compose -f podman-compose.yml exec db psql -U postgres -d memory_layer -f /migrations/001_add_new_table.sql
```

## Migration from Docker to Podman

### Quick Migration Script

```bash
#!/bin/bash
# migrate-to-podman.sh

echo "🚀 Migrating Developer Memory Layer to Podman..."

# Stop existing Docker containers
echo "Stopping Docker containers..."
docker-compose down

# Export Docker volumes (if needed)
echo "Creating volume backups..."
mkdir -p ./backups
docker run --rm -v developer-memory-layer_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
docker run --rm -v developer-memory-layer_redis_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/redis_data.tar.gz -C /data .

# Start with Podman
echo "Starting services with Podman..."
podman-compose -f podman-compose.yml up -d

# Import volumes if needed
if [ -f "./backups/postgres_data.tar.gz" ]; then
    echo "Restoring PostgreSQL data..."
    podman volume create postgres_data
    podman run --rm -v postgres_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data
fi

echo "✅ Migration complete! Your app is now running with Podman."
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:4000"
```

### Manual Migration Steps

1. **Stop Docker services**: `docker-compose down`
2. **Install Podman**: Follow [installation guide](https://podman.io/getting-started/installation)
3. **Start with Podman**: `podman-compose -f podman-compose.yml up -d`
4. **Verify services**: `podman-compose -f podman-compose.yml ps`

## Monitoring and Maintenance

### Health Checks
- **API Gateway**: http://localhost:4000/health
- **Memory Service**: http://localhost:4001/health
- **Search Service**: http://localhost:4002/health

### Backup Strategy
```bash
# Database backup with Podman
podman-compose -f podman-compose.yml exec db pg_dump -U postgres memory_layer > backup_$(date +%Y%m%d).sql

# Automated backups (add to cron)
0 2 * * * /path/to/backup-script.sh
```

### Performance Monitoring
- **Application metrics**: Built-in Express middleware
- **Database performance**: pgAdmin queries
- **System resources**: `podman stats`
- **Container health**: `podman healthcheck run <container>`

## Troubleshooting

### Common Issues

**🔴 Database connection failed**
```bash
# Check if PostgreSQL is running
podman-compose -f podman-compose.yml ps db

# Check logs
podman-compose -f podman-compose.yml logs db

# Reset database
podman-compose -f podman-compose.yml down -v
podman-compose -f podman-compose.yml up -d
```

**🔴 Frontend can't connect to API**
```bash
# Check API Gateway health
curl http://localhost:4000/health

# Check CORS configuration
# Make sure FRONTEND_URL matches your frontend URL
```

**🔴 Search not working**
```bash
# Check if vector database is configured
podman-compose -f podman-compose.yml logs search-service

# Ensure OpenAI API key is set
echo $OPENAI_API_KEY
```

**🔴 Podman permission issues**
```bash
# Fix volume permissions for rootless Podman
podman unshare chown -R 1000:1000 ~/.local/share/containers/storage/volumes/

# Or use :Z flag for SELinux
podman run -v ./data:/data:Z postgres:15
```

### Getting Help

1. **Check the logs**: `podman-compose -f podman-compose.yml logs [service-name]`
2. **Review the documentation**: [Podman Setup Guide](./PODMAN-SETUP.md)
3. **Open an issue**: [GitHub Issues](https://github.com/vosbek/developer-memory-layer/issues)
4. **Join our Discord**: [Community Link](#) (coming soon)

## Next Steps

1. **🔧 Configure Integrations**: Set up GitHub, Jira, M365 connections
2. **🤖 Enable AI Features**: Add OpenAI API key for smart search
3. **👥 Invite Team Members**: Set up authentication and user management
4. **📊 Monitor Usage**: Set up analytics and performance monitoring
5. **🚀 Scale Up**: Move to production deployment when ready

## Security Considerations

### Podman Security Benefits
- **Rootless containers**: Better security by default
- **No daemon**: Direct container execution
- **SELinux integration**: Enhanced access control
- **User namespaces**: Isolated container users

### General Security
- **Environment Variables**: Never commit API keys to git
- **Database Security**: Use strong passwords and connection encryption
- **API Security**: Implement proper rate limiting and authentication
- **Network Security**: Use HTTPS in production
- **Data Privacy**: Ensure GDPR compliance for team deployments

---

**💡 Pro Tip**: Podman provides all the benefits of Docker with enhanced security and no daemon dependency. The migration is seamless - just replace `docker-compose` with `podman-compose`!

**🔄 Migrating from Docker?** See our [detailed migration guide](./PODMAN-SETUP.md#migration-from-docker) for step-by-step instructions.
