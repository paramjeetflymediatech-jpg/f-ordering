# Hostinger VPS Deployment Guide (Ubuntu 24.04)

This guide walks you through setting up and launching the Multi-Tenant POS & Online Ordering SaaS Platform on a Hostinger VPS running Ubuntu 24.04 LTS.

---

## 1. System Preparation & Package Updates

Log in to your VPS via SSH:
```bash
ssh root@your_vps_ip
```

Update and upgrade the OS repository packages:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Install Core Infrastructure Stack

### A. Install Node.js (v20 LTS) & Git
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential
```

Verify version:
```bash
node -v
npm -v
```

### B. Install MySQL 8
```bash
sudo apt install mysql-server -y
```

Secure the installation:
```bash
sudo mysql_secure_installation
```

Log in and create the database and user:
```bash
sudo mysql
```
```sql
CREATE DATABASE IF NOT EXISTS flymedia_db;
CREATE USER 'pos_user'@'localhost' IDENTIFIED BY 'antigravity_pos_password';
GRANT ALL PRIVILEGES ON flymedia_db.* TO 'pos_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### C. Install Redis Server
Redis is required by BullMQ for print queues.
```bash
sudo apt install redis-server -y
```
Enable and start Redis:
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

---

## 3. Application Setup

### A. Clone and Install Code base
Move into your chosen web directory (e.g. `/var/www/`):
```bash
sudo mkdir -p /var/www/pos-platform
sudo chown -R $USER:$USER /var/www/pos-platform
cd /var/www/pos-platform
git clone <your-repository-url> .
npm install
```

### B. Environment Variables Configuration
Create a `.env` file:
```bash
nano .env
```
Paste and fill the variables:
```ini
NODE_ENV=production
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=pos_user
DB_PASSWORD=antigravity_pos_password
DB_NAME=flymedia_db
REDIS_URL=redis://127.0.0.1:6379
NEXTAUTH_SECRET=generate_a_random_32_character_string
NEXTAUTH_URL=https://yourdomain.com
```

### C. Build the Application Bundle
```bash
npm run build
```

---

## 4. Process Management with PM2

Install PM2 globally:
```bash
sudo npm install -g pm2 ts-node typescript
```

Start the custom Socket.IO/BullMQ server using the ecosystem configuration:
```bash
pm2 start ecosystem.config.js --env production
```

Configure PM2 to restart the service on system reboots:
```bash
pm2 startup
pm2 save
```

---

## 5. Web Server Configuration (Nginx)

Install Nginx:
```bash
sudo apt install nginx -y
```

Copy the repository `nginx.conf` file to Nginx site configurations:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/pos-platform
sudo ln -s /etc/nginx/sites-available/pos-platform /etc/nginx/sites-enabled/
```

Remove default configuration, test the syntax, and restart Nginx:
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Secure HTTPS (Let's Encrypt SSL)

Install Certbot for automated Let's Encrypt configurations:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtain and apply SSL Certificate (ensure DNS matches server IP first):
```bash
sudo certbot --nginx -d yourdomain.com -d *.yourdomain.com
```

Test auto-renewals:
```bash
sudo certbot renew --dry-run
```

---

## 7. Initialize Database Tables
Navigate to your dashboard (`https://yourdomain.com/dashboard`) and click the **"Seed Database"** action to run the migrations and seeds, or trigger it via curl:
```bash
curl -X POST https://yourdomain.com/api/db/sync
```

Your POS Terminal is now fully active at `https://yourdomain.com/login`!
```
Demo Logins:
- Owner: owner@antigravity.com / password123
- Cashier: cashier@antigravity.com / password123
```
