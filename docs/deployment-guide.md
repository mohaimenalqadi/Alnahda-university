# Deployment Guide
# Al-Nahda University - Student Results System

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [VPS Setup](#vps-setup)
5. [SSL Configuration](#ssl-configuration)
6. [Database Management](#database-management)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 20+ LTS
- **Docker** 24+ & Docker Compose v2
- **PostgreSQL** 16 (or Docker container)
- **Redis** 7 (or Docker container)
- **Git**

### Recommended Hosting
| Provider | Specs | Price/Month |
|----------|-------|-------------|
| **Hetzner Cloud CX21** (Recommended) | 2 vCPU, 4GB RAM, 40GB SSD | ~€4.15 |
| Contabo VPS S | 4 vCPU, 8GB RAM, 200GB SSD | ~€5.99 |
| DigitalOcean Droplet | 2 vCPU, 2GB RAM, 50GB SSD | ~$18 |

### Domain Providers
- **Namecheap**: ~$8-12/year
- **Porkbun**: ~$8-10/year  
- **Cloudflare Registrar**: At cost pricing

---

## Local Development

### 1. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd alnahda-university

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Start with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Access services
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
# API Docs: http://localhost:4000/api/docs
```

### 3. Run Without Docker

```bash
# Terminal 1: Start PostgreSQL and Redis manually or via Docker
docker-compose up -d postgres redis

# Terminal 2: Backend
cd backend
npm install
cp .env.example .env  # Update DATABASE_URL and REDIS_URL
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Terminal 3: Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 4. Test Credentials

**Admin Login:**
- Email: `admin@alnahda-university.edu`
- Password: `Admin@123456`

**Student Login (Example):**
- Registration Number: `2024-CS-001`
- Date of Birth: `2002-05-15`

---

## Production Deployment

### 1. Environment Configuration

Create production environment files:

```bash
# .env (root)
POSTGRES_USER=alnahda_prod
POSTGRES_PASSWORD=<STRONG_RANDOM_PASSWORD>
POSTGRES_DB=alnahda_production
REDIS_PASSWORD=<STRONG_RANDOM_PASSWORD>
JWT_ACCESS_SECRET=<64_CHAR_RANDOM_STRING>
JWT_REFRESH_SECRET=<64_CHAR_RANDOM_STRING>
CORS_ORIGINS=https://results.your-domain.edu
```

Generate secure secrets:
```bash
openssl rand -base64 64 | tr -d '\n'
```

### 2. Build Production Images

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database (first time only)
docker-compose exec backend npx prisma db seed
```

### 3. Nginx Reverse Proxy

Install Nginx on host:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Create Nginx config `/etc/nginx/sites-available/alnahda`:
```nginx
server {
    listen 80;
    server_name results.your-domain.edu;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name results.your-domain.edu;

    ssl_certificate /etc/letsencrypt/live/results.your-domain.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/results.your-domain.edu/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Login with stricter rate limit
    location /api/v1/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/alnahda /etc/nginx/sites-enabled/
sudo certbot --nginx -d results.your-domain.edu
sudo nginx -t
sudo systemctl reload nginx
```

---

## VPS Setup

### Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Install essential tools
sudo apt install git htop ufw fail2ban

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Automated Backups

Create backup script `/opt/scripts/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR=/opt/backups
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER=alnahda-postgres

mkdir -p $BACKUP_DIR

# Backup database
docker exec $CONTAINER pg_dump -U alnahda alnahda_production | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

Add to crontab:
```bash
chmod +x /opt/scripts/backup-db.sh
crontab -e
# Add: 0 2 * * * /opt/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## SSL Configuration

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d results.your-domain.edu

# Auto-renewal (already configured by Certbot)
sudo certbot renew --dry-run
```

### SSL Best Practices

Add to Nginx config:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_stapling on;
ssl_stapling_verify on;
```

---

## Database Management

### Migrations

```bash
# Create new migration (development)
docker-compose exec backend npx prisma migrate dev --name <migration_name>

# Apply migrations (production)
docker-compose exec backend npx prisma migrate deploy

# Reset database (development only!)
docker-compose exec backend npx prisma migrate reset
```

### Database Backup & Restore

```bash
# Backup
docker exec alnahda-postgres pg_dump -U alnahda alnahda_production > backup.sql

# Restore
cat backup.sql | docker exec -i alnahda-postgres psql -U alnahda alnahda_production
```

---

## Monitoring

### Health Checks

Backend health endpoint: `GET /api/v1/health`

```bash
curl http://localhost:4000/api/v1/health
```

### Log Management

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Export logs
docker-compose logs > logs.txt
```

### Resource Monitoring

```bash
# Container stats
docker stats

# System resources
htop
```

---

## Troubleshooting

### Common Issues

**1. Database connection failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U alnahda -d alnahda_university
```

**2. Redis connection failed**
```bash
# Check Redis
docker-compose exec redis redis-cli -a <password> ping
```

**3. Frontend can't reach backend**
- Check CORS_ORIGINS in backend .env
- Verify API URL in frontend .env.local
- Check Nginx proxy configuration

**4. SSL certificate issues**
```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

**5. Permission issues**
```bash
# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock

# Fix file permissions
sudo chown -R $USER:$USER /path/to/project
```

---

## Quick Commands Reference

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# View logs (follow)
docker-compose logs -f

# Enter container shell
docker-compose exec backend sh

# Run Prisma Studio (DB GUI)
docker-compose exec backend npx prisma studio

# Clear cache
docker-compose exec redis redis-cli -a <password> FLUSHALL
```

---

**For support, contact the IT department at Al-Nahda University.**
