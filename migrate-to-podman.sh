#!/bin/bash

# 🚀 Developer Memory Layer - Docker to Podman Migration Script
# This script helps migrate your existing Docker setup to Podman

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Wait for service to be ready
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "$service_name did not become ready within expected time"
    return 1
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    # Check if containers are running
    local containers=$(podman-compose -f podman-compose.yml ps --services --filter "status=running")
    
    if [ -z "$containers" ]; then
        print_error "No containers are running!"
        return 1
    fi
    
    # Test service endpoints
    wait_for_service "Database" "http://localhost:5432" || true
    wait_for_service "Redis" "http://localhost:6379" || true
    wait_for_service "API Gateway" "http://localhost:4000/health" || true
    wait_for_service "Frontend" "http://localhost:3000" || true
    wait_for_service "pgAdmin" "http://localhost:5050" || true
    
    echo
    print_success "Health check completed!"
}

# Clean up Docker resources (optional)
cleanup_docker() {
    read -p "Do you want to clean up Docker volumes and containers? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up Docker resources..."
        
        # Remove Docker volumes
        if docker volume ls | grep -q "developer-memory-layer"; then
            docker volume ls | grep "developer-memory-layer" | awk '{print $2}' | xargs docker volume rm || true
        fi
        
        # Remove Docker containers
        if docker ps -a | grep -q "developer-memory-layer"; then
            docker ps -a | grep "developer-memory-layer" | awk '{print $1}' | xargs docker rm || true
        fi
        
        # Remove Docker images (optional)
        read -p "Do you want to remove Docker images as well? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker images | grep "developer-memory-layer" | awk '{print $3}' | xargs docker rmi || true
        fi
        
        print_success "Docker cleanup completed!"
    else
        print_status "Skipping Docker cleanup. You can manually clean up later if needed."
    fi
}

# Generate systemd services for auto-start (Linux only)
setup_systemd() {
    if [[ "$OSTYPE" == "linux-gnu"* ]] && command_exists systemctl; then
        read -p "Do you want to set up systemd services for auto-start? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Setting up systemd services..."
            
            # Create pod first
            podman pod create --name memory-layer-pod \
                -p 3000:3000 -p 4000:4000 -p 4001:4001 -p 4002:4002 -p 4003:4003 \
                -p 5432:5432 -p 6379:6379 -p 5050:80
            
            # Generate systemd service
            podman generate systemd --new --name memory-layer-pod --files
            
            # Move service file to systemd directory
            mkdir -p ~/.config/systemd/user
            mv pod-memory-layer-pod.service ~/.config/systemd/user/
            
            # Enable and start service
            systemctl --user daemon-reload
            systemctl --user enable pod-memory-layer-pod.service
            
            print_success "Systemd service created! You can now use:"
            echo "  systemctl --user start pod-memory-layer-pod"
            echo "  systemctl --user stop pod-memory-layer-pod"
            echo "  systemctl --user status pod-memory-layer-pod"
        fi
    else
        print_status "Systemd setup skipped (not available on this system)"
    fi
}

# Main migration function
main() {
    echo "🚀 Developer Memory Layer - Docker to Podman Migration"
    echo "======================================================"
    echo

    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists podman; then
        print_error "Podman is not installed. Please install Podman first:"
        echo "  • macOS: brew install podman"
        echo "  • Ubuntu/Debian: sudo apt-get install podman"
        echo "  • RHEL/CentOS/Fedora: sudo dnf install podman"
        echo "  • Windows: https://podman.io/getting-started/installation"
        exit 1
    fi
    
    if ! command_exists podman-compose; then
        print_warning "podman-compose not found. Installing via pip..."
        if command_exists pip3; then
            pip3 install podman-compose
        elif command_exists pip; then
            pip install podman-compose
        else
            print_error "pip not found. Please install podman-compose manually:"
            echo "  pip3 install podman-compose"
            exit 1
        fi
    fi

    print_success "Prerequisites check completed!"
    echo

    # Stop existing Docker containers
    print_status "Stopping existing Docker containers..."
    if command_exists docker-compose && [ -f "docker-compose.yml" ]; then
        docker-compose down || print_warning "Failed to stop Docker containers (they might not be running)"
    else
        print_warning "docker-compose.yml not found or Docker Compose not available"
    fi
    echo

    # Create data directories for bind mounts
    print_status "Creating data directories..."
    mkdir -p data/postgres data/redis data/pgadmin
    
    # Set proper permissions for Podman rootless
    if [ "$(id -u)" -ne 0 ]; then
        print_status "Setting up rootless Podman permissions..."
        # Ensure user namespaces are properly configured
        if [ ! -f /etc/subuid ] || ! grep -q "$(whoami)" /etc/subuid; then
            print_warning "User subuid/subgid not properly configured. You may need to run:"
            echo "  sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $(whoami)"
        fi
    fi
    echo

    # Backup existing Docker volumes (if they exist)
    print_status "Checking for existing Docker volumes to backup..."
    BACKUP_DIR="./backups/migration_$(date +%Y%m%d_%H%M%S)"
    
    if command_exists docker && docker volume ls | grep -q "developer-memory-layer_postgres_data"; then
        print_status "Backing up PostgreSQL data..."
        mkdir -p "$BACKUP_DIR"
        docker run --rm \
            -v developer-memory-layer_postgres_data:/data \
            -v "$(pwd)/$BACKUP_DIR":/backup \
            alpine tar czf /backup/postgres_data.tar.gz -C /data . || print_warning "Failed to backup PostgreSQL data"
        print_success "PostgreSQL data backed up to $BACKUP_DIR/postgres_data.tar.gz"
    fi
    
    if command_exists docker && docker volume ls | grep -q "developer-memory-layer_redis_data"; then
        print_status "Backing up Redis data..."
        mkdir -p "$BACKUP_DIR"
        docker run --rm \
            -v developer-memory-layer_redis_data:/data \
            -v "$(pwd)/$BACKUP_DIR":/backup \
            alpine tar czf /backup/redis_data.tar.gz -C /data . || print_warning "Failed to backup Redis data"
        print_success "Redis data backed up to $BACKUP_DIR/redis_data.tar.gz"
    fi
    echo

    # Start services with Podman
    print_status "Starting services with Podman..."
    if [ -f "podman-compose.yml" ]; then
        podman-compose -f podman-compose.yml up -d
        print_success "Services started with Podman!"
    else
        print_error "podman-compose.yml not found!"
        exit 1
    fi
    echo

    # Restore data if backups exist
    if [ -d "$BACKUP_DIR" ]; then
        print_status "Restoring data from Docker volumes..."
        
        if [ -f "$BACKUP_DIR/postgres_data.tar.gz" ]; then
            print_status "Restoring PostgreSQL data..."
            # Stop the database first
            podman-compose -f podman-compose.yml stop db
            # Extract data to bind mount directory
            tar xzf "$BACKUP_DIR/postgres_data.tar.gz" -C ./data/postgres/
            # Fix permissions
            podman unshare chown -R 999:999 ./data/postgres
            # Restart the database
            podman-compose -f podman-compose.yml start db
            print_success "PostgreSQL data restored!"
        fi
        
        if [ -f "$BACKUP_DIR/redis_data.tar.gz" ]; then
            print_status "Restoring Redis data..."
            # Stop Redis first
            podman-compose -f podman-compose.yml stop redis
            # Extract data to bind mount directory
            tar xzf "$BACKUP_DIR/redis_data.tar.gz" -C ./data/redis/
            # Fix permissions
            podman unshare chown -R 999:999 ./data/redis
            # Restart Redis
            podman-compose -f podman-compose.yml start redis
            print_success "Redis data restored!"
        fi
    fi
    echo

    # Wait for services to be ready and check health
    check_service_health
    echo

    # Show status
    print_status "Checking final status..."
    podman-compose -f podman-compose.yml ps
    echo

    # Migration complete
    print_success "🎉 Migration completed successfully!"
    echo
    echo "Your Developer Memory Layer is now running with Podman:"
    echo "  • Frontend: http://localhost:3000"
    echo "  • API Gateway: http://localhost:4000"
    echo "  • Database Admin: http://localhost:5050 (admin@example.com / admin)"
    echo
    echo "Useful Podman commands:"
    echo "  • View status: podman-compose -f podman-compose.yml ps"
    echo "  • View logs: podman-compose -f podman-compose.yml logs -f"
    echo "  • Stop services: podman-compose -f podman-compose.yml down"
    echo "  • Restart services: podman-compose -f podman-compose.yml restart"
    echo
    
    # Optional cleanup and systemd setup
    echo
    cleanup_docker
    echo
    setup_systemd
    
    echo
    print_success "Migration script completed! 🚀"
    echo "For more Podman-specific features and troubleshooting, see PODMAN-SETUP.md"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Developer Memory Layer - Docker to Podman Migration Script"
        echo
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Check prerequisites only"
        echo "  --cleanup      Clean up Docker resources only"
        echo
        echo "This script will:"
        echo "  1. Check prerequisites (Podman, podman-compose)"
        echo "  2. Stop existing Docker containers"
        echo "  3. Backup Docker volumes"
        echo "  4. Start services with Podman"
        echo "  5. Restore data from backups"
        echo "  6. Verify service health"
        echo "  7. Optionally clean up Docker resources"
        echo "  8. Optionally set up systemd services"
        ;;
    --check)
        if ! command_exists podman; then
            print_error "Podman is not installed"
            exit 1
        fi
        if ! command_exists podman-compose; then
            print_error "podman-compose is not installed"
            exit 1
        fi
        print_success "All prerequisites are installed!"
        ;;
    --cleanup)
        cleanup_docker
        ;;
    *)
        main "$@"
        ;;
esac
