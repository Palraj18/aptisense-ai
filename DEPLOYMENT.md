# AptiSense AI - Deployment Guide

Complete guide for deploying AptiSense AI to production environments.

## Pre-Deployment Checklist

- [ ] All environment variables configured in `.env`
- [ ] GEMINI_API_KEY validated and working
- [ ] Backend tests passing
- [ ] Frontend builds without errors
- [ ] Docker images built successfully
- [ ] Database backups configured
- [ ] Monitoring and logging setup
- [ ] SSL/TLS certificates ready
- [ ] Security audit completed
- [ ] Performance baseline established

## Production Environment Setup

### System Requirements

**Backend Server**
- OS: Linux (Ubuntu 20.04+ recommended)
- RAM: 4GB minimum, 8GB recommended
- CPU: 2 cores minimum, 4+ cores recommended
- Storage: 20GB minimum SSD
- Python 3.9+
- PostgreSQL 12+ (if using database)

**Frontend Server**
- Node.js 18+
- Nginx or similar reverse proxy
- 2GB storage minimum

### Production Configuration

Create `.env.production`:

```env
# Environment
DEBUG=False
ENV=production

# Gemini API (from Google AI Studio)
GEMINI_API_KEY=<production_key>

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost/aptisense_db

# CORS
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Interview Settings
MAX_INTERVIEW_DURATION_MINUTES=60
MIN_INTERVIEW_DURATION_MINUTES=5
MAX_FOLLOW_UP_QUESTIONS=3
ADAPTIVE_DIFFICULTY_THRESHOLD=0.65

# Proctoring
FACE_DETECTION_CONFIDENCE=0.5
MAX_LOOKING_AWAY_DURATION_SECONDS=5
CHEATING_PROBABILITY_THRESHOLD=0.7

# Security
SECRET_KEY=<generate_with_openssl>
ALLOWED_HOSTS=yourdomain.com,app.yourdomain.com

# API
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
```

## Docker Deployment

### Build Docker Images

```bash
# Build both images
docker-compose build

# Or build individually
docker build -t aptisense-backend:latest -f backend/Dockerfile .
docker build -t aptisense-frontend:latest -f frontend/Dockerfile .
```

### Deploy with Docker Compose

```bash
# Production deployment with environment file
docker-compose --env-file .env.production up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### Docker Registry Push

```bash
# Tag images
docker tag aptisense-backend:latest myregistry/aptisense-backend:latest
docker tag aptisense-frontend:latest myregistry/aptisense-frontend:latest

# Login to registry
docker login myregistry

# Push images
docker push myregistry/aptisense-backend:latest
docker push myregistry/aptisense-frontend:latest
```

## Kubernetes Deployment

### Create Kubernetes Manifests

**backend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aptisense-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aptisense-backend
  template:
    metadata:
      labels:
        app: aptisense-backend
    spec:
      containers:
      - name: backend
        image: myregistry/aptisense-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: aptisense-secrets
              key: gemini-api-key
        - name: ENV
          value: "production"
```

### Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic aptisense-secrets \
  --from-literal=gemini-api-key=<your_key>

# Apply manifests
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Verify deployment
kubectl get pods
kubectl get services
```

## Traditional Server Deployment

### Backend Setup (Ubuntu 20.04)

1. **Install dependencies:**
```bash
sudo apt-get update
sudo apt-get install python3.9 python3-pip python3-venv
sudo apt-get install postgresql postgresql-contrib

# Create virtual environment
python3 -m venv /opt/aptisense/venv
source /opt/aptisense/venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

2. **Configure Systemd Service:**

Create `/etc/systemd/system/aptisense-backend.service`:
```ini
[Unit]
Description=AptiSense AI Backend
After=network.target

[Service]
Type=notify
User=aptisense
WorkingDirectory=/opt/aptisense
Environment="PATH=/opt/aptisense/venv/bin"
ExecStart=/opt/aptisense/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

3. **Start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl start aptisense-backend
sudo systemctl enable aptisense-backend
```

### Frontend Setup (Ubuntu 20.04)

1. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Build frontend:**
```bash
cd frontend
npm install
npm run build
```

3. **Configure Nginx:**

Create `/etc/nginx/sites-available/aptisense`:
```nginx
upstream backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name yourdomain.com;
    client_max_body_size 100M;

    # Frontend
    location / {
        root /opt/aptisense/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable and start Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/aptisense /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL/TLS Configuration

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Update Nginx for HTTPS

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Database Configuration

### PostgreSQL Setup

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE aptisense_db;
CREATE USER aptisense_user WITH PASSWORD 'secure_password';
ALTER ROLE aptisense_user SET client_encoding TO 'utf8';
ALTER ROLE aptisense_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE aptisense_user SET default_transaction_deferrable TO on;
ALTER ROLE aptisense_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE aptisense_db TO aptisense_user;
```

## Monitoring & Logging

### Backend Logging

Configure logging in `app/core/config.py`:
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/aptisense/backend.log'),
        logging.StreamHandler()
    ]
)
```

### Health Checks

Monitor endpoint: `GET /health`

```bash
# Example monitoring script
while true; do
    curl -f http://localhost:8000/health || alert "Backend unhealthy"
    sleep 60
done
```

### Log Aggregation

Example with ELK Stack:
```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/aptisense/*.log

output.elasticsearch:
  hosts: ["localhost:9200"]
```

## Performance Optimization

### Backend Optimization

1. **Enable caching:**
```python
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend

# Configure Redis caching
FastAPICache2.init(RedisBackend(url="redis://localhost"), prefix="fastapi-cache")
```

2. **Database connection pooling:**
```python
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)
```

### Frontend Optimization

1. **Enable compression:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

2. **Set proper cache headers:**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Backup & Recovery

### Database Backup

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/aptisense"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump -U aptisense_user aptisense_db | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Session Data Backup

```bash
# Backup interview sessions
tar -czf /backups/sessions_$(date +%Y%m%d).tar.gz ./backend/data/sessions/
```

## Troubleshooting

### Common Issues

1. **GEMINI_API_KEY not found**
   - Verify `.env` has correct key
   - Restart backend service: `systemctl restart aptisense-backend`

2. **Backend can't connect to database**
   - Check PostgreSQL is running
   - Verify DATABASE_URL connection string
   - Check database credentials

3. **Frontend shows blank page**
   - Check browser console for errors
   - Verify API_URL is correct
   - Check CORS settings in backend

4. **High memory usage**
   - Check for memory leaks in services
   - Monitor with `docker stats`
   - Scale horizontally with multiple replicas

## Rollback Procedure

```bash
# If deployment fails, rollback to previous version
docker-compose down
git checkout <previous_commit>
docker-compose build
docker-compose up -d
```

## Post-Deployment

- [ ] Verify all endpoints respond correctly
- [ ] Test AI interview flow end-to-end
- [ ] Validate proctoring frame analysis
- [ ] Check analytics calculations
- [ ] Review logs for errors
- [ ] Monitor system resources
- [ ] Test backup and restore procedures
- [ ] Set up monitoring alerts
- [ ] Document deployment configuration
- [ ] Brief support team on troubleshooting

## Support

For deployment issues, check logs:
```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# System logs
tail -f /var/log/syslog
```

---

**Current Version**: 2.0.0
**Last Updated**: 2024
