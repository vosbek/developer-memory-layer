# 🚀 Developer Memory Layer - Podman Setup Guide

## Quick Start with Podman

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Podman & Podman Compose** - [Installation guide](https://podman.io/getting-started/installation)
- **Git** - [Download here](https://git-scm.com/)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/vosbek/developer-memory-layer.git
cd developer-memory-layer

# Copy environment file
cp .env.example .env

# Edit your environment variables (optional for basic usage)
nano .env
```

### 2. Run with Podman (Recommended)

```bash
# Start all services with Podman Compose
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

### 3. Alternative: Individual Podman Commands

If you prefer more control or don't have podman-compose:

```bash
# Create a pod for the application
podman pod create --name memory-layer -p 3000:3000 -p 4000:4000 -p 5432:5432 -p 6379:6379 -p 5050:80

# Start PostgreSQL
podman run -d --name postgres \
  --pod memory-layer \
  -e POSTGRES_DB=memory_layer \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15

# Start Redis
podman run -d --name redis \
  --pod memory-layer \
  -v redis_data:/data \
  redis:7-alpine

# Build and start API Gateway
podman build -t memory-api ./backend/api-gateway
podman run -d --name api-gateway \
  --pod memory-layer \
  -e DATABASE_URL=postgresql://postgres:password@localhost:5432/memory_layer \
  -e REDIS_URL=redis://localhost:6379 \
  memory-api

# Build and start Frontend
podman build -t memory-frontend .
podman run -d --name frontend \
  --pod memory-layer \
  -e REACT_APP_API_URL=http://localhost:4000 \
  memory-frontend

# Optional: pgAdmin for database management
podman run -d --name pgadmin \
  --pod memory-layer \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  dpage/pgadmin4:latest
```

### 4. Podman Development Commands

```bash
# Build specific service
podman-compose -f podman-compose.yml build api-gateway

# Restart single service
podman-compose -f podman-compose.yml restart memory-service

# View service logs
podman-compose -f podman-compose.yml logs api-gateway

# Execute commands in containers
podman-compose -f podman-compose.yml exec db psql -U postgres memory_layer

# Clean up everything
podman-compose -f podman-compose.yml down -v
podman pod rm memory-layer --force
```

## Team Setup with Podman

### Shared Development Environment

```bash
# Create shared volumes for team development
podman volume create memory-layer-postgres
podman volume create memory-layer-redis

# Use consistent container names across team
podman-compose -f podman-compose.yml up -d

# Share configuration via git
git add .env.team-example
git commit -m "Add team environment example"
```

### Production Deployment with Podman

```bash
# Generate systemd services for auto-start
podman generate systemd --new --name memory-layer-pod > memory-layer.service

# Install and enable service
sudo mv memory-layer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable memory-layer.service
sudo systemctl start memory-layer.service
```

## Podman vs Docker Differences

### Why Podman?
- **Rootless containers** - Better security by default
- **No daemon** - Direct container execution
- **Drop-in replacement** - Same commands and compose files
- **Systemd integration** - Native service management
- **Kubernetes compatible** - Generate K8s YAML directly

### Migration from Docker

If you're migrating from Docker, these commands are equivalent:

```bash
# Docker commands → Podman commands
docker run → podman run
docker build → podman build  
docker-compose up → podman-compose up
docker ps → podman ps
docker exec → podman exec
```

The compose file syntax is identical - just use `podman-compose` instead of `docker-compose`.

## Troubleshooting Podman Issues

### Common Podman Problems

**🔴 Port binding issues**
```bash
# Check if ports are in use
sudo ss -tulpn | grep :3000

# Use different ports if needed
podman-compose -f podman-compose.yml up -d --scale frontend=1
```

**🔴 Permission issues with volumes**
```bash
# Fix volume permissions
podman unshare chown -R 1000:1000 ~/.local/share/containers/storage/volumes/

# Or use :Z flag for SELinux
podman run -v ./data:/data:Z postgres:15
```

**🔴 Podman compose not found**
```bash
# Install podman-compose
pip3 install podman-compose

# Or use docker-compose with podman
export DOCKER_HOST=unix://$(podman info --format '{{.Host.RemoteSocket.Path}}')
docker-compose up
```

**🔴 Container networking issues**
```bash
# Create custom network
podman network create memory-layer-net

# Use custom network in compose
networks:
  default:
    external:
      name: memory-layer-net
```

## Performance Optimization

### Podman Resource Limits

```bash
# Limit memory usage
podman run --memory=1g --memory-swap=2g memory-api

# Limit CPU usage  
podman run --cpus=1.5 memory-api

# Set resource limits in compose
services:
  api-gateway:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

### Faster Builds

```bash
# Use buildah for faster builds
buildah build -t memory-api ./backend/api-gateway

# Multi-stage builds for smaller images
FROM node:18-alpine AS builder
# ... build steps
FROM node:18-alpine AS runtime
COPY --from=builder /app/dist /app/dist
```

## Security Considerations

### Rootless Podman Benefits

```bash
# Run as non-root user (default in Podman)
podman run --user 1000:1000 memory-api

# No sudo required for container operations
podman ps  # Works without sudo

# Containers cannot access host root
podman run --rm -it alpine cat /etc/shadow  # Fails securely
```

### SELinux Integration

```bash
# Enable SELinux labels for volumes
podman run -v ./data:/data:Z postgres:15

# Check SELinux context
ls -Z data/
```

## Monitoring & Maintenance

### Container Health Checks

```bash
# Check container health
podman healthcheck run api-gateway

# View container stats
podman stats

# Monitor resource usage
podman top api-gateway
```

### Backup & Recovery

```bash
# Backup volumes
podman volume export postgres_data --output=postgres-backup.tar

# Restore volumes
podman volume import postgres_data postgres-backup.tar

# Backup entire pod configuration
podman generate kube memory-layer-pod > memory-layer-k8s.yaml
```

## Next Steps

1. **🔧 Configure Integrations**: Set up GitHub, Jira, M365 connections
2. **🤖 Enable AI Features**: Add OpenAI API key for smart search
3. **👥 Setup Team Access**: Configure authentication and user management
4. **📊 Monitor Performance**: Set up logging and metrics
5. **🚀 Scale to Production**: Move to Kubernetes or systemd services

---

**💡 Pro Tip**: Podman's rootless containers and SELinux integration make it more secure than Docker by default, while maintaining full compatibility with your existing container workflows!