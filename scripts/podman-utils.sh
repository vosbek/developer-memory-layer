#!/bin/bash

# 🔧 Developer Memory Layer - Podman Utility Scripts
# Collection of helpful commands for managing the application with Podman

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}$1${NC}"
    echo "============================================"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to run podman-compose with the correct file
pc() {
    podman-compose -f podman-compose.yml "$@"
}

# Show help
show_help() {
    cat << EOF
🚀 Developer Memory Layer - Podman Utilities

Usage: $0 [COMMAND]

Commands:
  start           Start all services
  stop            Stop all services
  restart         Restart all services
  status          Show service status
  logs [service]  Show logs (optionally for specific service)
  build [service] Rebuild containers (optionally specific service)
  shell <service> Open shell in container
  db              Connect to PostgreSQL database
  redis           Connect to Redis CLI
  clean           Clean up containers and volumes
  reset           Reset everything (clean + rebuild)
  backup          Backup database and Redis data
  restore <date>  Restore from backup
  health          Check service health
  monitor         Monitor resource usage
  generate-k8s    Generate Kubernetes YAML files

Examples:
  $0 start                    # Start all services
  $0 logs api-gateway         # Show API gateway logs
  $0 shell frontend           # Open shell in frontend container
  $0 backup                   # Create backup
  $0 restore 20240610         # Restore backup from June 10, 2024

EOF
}

# Start services
start_services() {
    print_header "Starting Developer Memory Layer with Podman"
    pc up -d
    print_success "Services started! Check status with: $0 status"
    echo
    echo "🌐 Application URLs:"
    echo "  Frontend:      http://localhost:3000"
    echo "  API Gateway:   http://localhost:4000"
    echo "  Database Admin: http://localhost:5050"
}

# Stop services
stop_services() {
    print_header "Stopping all services"
    pc down
    print_success "All services stopped"
}

# Restart services
restart_services() {
    print_header "Restarting all services"
    pc restart
    print_success "All services restarted"
}

# Show status
show_status() {
    print_header "Service Status"
    pc ps
    echo
    print_header "Resource Usage"
    podman stats --no-stream
}

# Show logs
show_logs() {
    local service=$1
    if [ -n "$service" ]; then
        print_header "Logs for $service"
        pc logs -f "$service"
    else
        print_header "All service logs"
        pc logs -f
    fi
}

# Build containers
build_containers() {
    local service=$1
    if [ -n "$service" ]; then
        print_header "Building $service"
        pc build "$service"
    else
        print_header "Building all containers"
        pc build
    fi
    print_success "Build completed"
}

# Open shell in container
open_shell() {
    local service=$1
    if [ -z "$service" ]; then
        print_error "Please specify a service name"
        print_warning "Available services: frontend, api-gateway, memory-service, search-service, integration-service, db, redis, pgadmin"
        exit 1
    fi
    
    print_header "Opening shell in $service"
    pc exec "$service" /bin/sh || pc exec "$service" /bin/bash
}

# Connect to database
connect_db() {
    print_header "Connecting to PostgreSQL database"
    pc exec db psql -U postgres -d memory_layer
}

# Connect to Redis
connect_redis() {
    print_header "Connecting to Redis CLI"
    pc exec redis redis-cli
}

# Clean up
clean_up() {
    print_header "Cleaning up containers and volumes"
    read -p "This will remove all containers and volumes. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pc down -v
        podman system prune -f
        print_success "Cleanup completed"
    else
        print_warning "Cleanup cancelled"
    fi
}

# Reset everything
reset_all() {
    print_header "Resetting entire application"
    read -p "This will remove everything and rebuild. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        clean_up
        build_containers
        start_services
        print_success "Reset completed"
    else
        print_warning "Reset cancelled"
    fi
}

# Backup data
backup_data() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_dir="./backups/$backup_date"
    
    print_header "Creating backup: $backup_date"
    mkdir -p "$backup_dir"
    
    # Backup PostgreSQL
    print_header "Backing up PostgreSQL database"
    pc exec db pg_dump -U postgres memory_layer > "$backup_dir/postgres_backup.sql"
    
    # Backup Redis
    print_header "Backing up Redis data"
    pc exec redis redis-cli BGSAVE
    sleep 2  # Wait for background save to complete
    podman cp "$(pc ps -q redis):/data/dump.rdb" "$backup_dir/redis_dump.rdb"
    
    # Backup environment and compose files
    cp .env "$backup_dir/env_backup" 2>/dev/null || true
    cp podman-compose.yml "$backup_dir/"
    
    # Create backup info file
    cat > "$backup_dir/backup_info.txt" << EOF
Backup created: $(date)
Application: Developer Memory Layer
Backup includes:
- PostgreSQL database dump
- Redis data dump
- Environment configuration
- Compose configuration
EOF
    
    print_success "Backup completed: $backup_dir"
    echo "Files created:"
    ls -la "$backup_dir"
}

# Restore data
restore_data() {
    local backup_date=$1
    if [ -z "$backup_date" ]; then
        print_error "Please specify backup date"
        print_warning "Available backups:"
        ls -1 ./backups/ 2>/dev/null || echo "No backups found"
        exit 1
    fi
    
    local backup_dir="./backups/$backup_date"
    if [ ! -d "$backup_dir" ]; then
        print_error "Backup directory not found: $backup_dir"
        exit 1
    fi
    
    print_header "Restoring from backup: $backup_date"
    read -p "This will overwrite current data. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Restore cancelled"
        exit 0
    fi
    
    # Stop services
    pc stop
    
    # Restore PostgreSQL
    if [ -f "$backup_dir/postgres_backup.sql" ]; then
        print_header "Restoring PostgreSQL database"
        pc start db
        sleep 5  # Wait for database to start
        pc exec -T db psql -U postgres -d memory_layer < "$backup_dir/postgres_backup.sql"
        print_success "PostgreSQL restored"
    fi
    
    # Restore Redis
    if [ -f "$backup_dir/redis_dump.rdb" ]; then
        print_header "Restoring Redis data"
        pc stop redis
        podman cp "$backup_dir/redis_dump.rdb" "$(pc ps -aq redis):/data/dump.rdb"
        pc start redis
        print_success "Redis restored"
    fi
    
    # Start all services
    pc start
    print_success "Restore completed"
}

# Health check
health_check() {
    print_header "Checking service health"
    
    # Check container status
    echo "Container Status:"
    pc ps
    echo
    
    # Check service endpoints
    services=(
        "Frontend:http://localhost:3000"
        "API Gateway:http://localhost:4000/health"
        "pgAdmin:http://localhost:5050"
    )
    
    for service_info in "${services[@]}"; do
        service_name=$(echo "$service_info" | cut -d: -f1)
        service_url=$(echo "$service_info" | cut -d: -f2-)
        
        if curl -f -s "$service_url" >/dev/null 2>&1; then
            print_success "$service_name is healthy"
        else
            print_error "$service_name is not responding"
        fi
    done
    
    # Check database connectivity
    if pc exec db pg_isready -U postgres >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
    else
        print_error "PostgreSQL is not ready"
    fi
    
    # Check Redis connectivity
    if pc exec redis redis-cli ping | grep -q "PONG"; then
        print_success "Redis is responding"
    else
        print_error "Redis is not responding"
    fi
}

# Monitor resources
monitor_resources() {
    print_header "Resource Monitoring"
    echo "Press Ctrl+C to exit"
    echo
    
    # Show real-time stats
    podman stats
}

# Generate Kubernetes YAML
generate_k8s() {
    print_header "Generating Kubernetes YAML files"
    
    # Create k8s directory
    mkdir -p k8s
    
    # Generate from running pod (if exists)
    if podman pod exists memory-layer-pod; then
        podman generate kube memory-layer-pod > k8s/memory-layer-pod.yaml
        print_success "Generated k8s/memory-layer-pod.yaml"
    else
        print_warning "No running pod found. Starting services first..."
        pc up -d
        sleep 10
        
        # Try to generate from compose
        print_warning "Generating basic Kubernetes manifests..."
        
        # This is a simplified approach - in practice you'd want more sophisticated K8s generation
        cat > k8s/namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: memory-layer
EOF
        
        cat > k8s/configmap.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: memory-layer-config
  namespace: memory-layer
data:
  DATABASE_URL: "postgresql://postgres:password@db:5432/memory_layer"
  REDIS_URL: "redis://redis:6379"
  NODE_ENV: "production"
EOF
        
        print_success "Generated basic Kubernetes manifests in k8s/ directory"
        print_warning "Note: These are basic manifests. You may need to customize them for your cluster."
    fi
}

# Main command handler
case "${1:-}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    build)
        build_containers "$2"
        ;;
    shell)
        open_shell "$2"
        ;;
    db)
        connect_db
        ;;
    redis)
        connect_redis
        ;;
    clean)
        clean_up
        ;;
    reset)
        reset_all
        ;;
    backup)
        backup_data
        ;;
    restore)
        restore_data "$2"
        ;;
    health)
        health_check
        ;;
    monitor)
        monitor_resources
        ;;
    generate-k8s)
        generate_k8s
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
