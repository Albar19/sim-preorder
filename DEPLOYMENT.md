# Deployment Guide - SIM Pre-order

## 🐳 Deploy dengan Docker

### Prasyarat
- Docker Desktop terinstall
- Git

### Langkah 1: Build Docker Image

```bash
# Clone atau pindah ke folder project
cd sim-preorder

# Build image
docker build -t sim-preorder .
```

### Langkah 2: Jalankan Container

**Cara 1: Docker Run (Simple)**
```bash
docker run -d \
  --name sim-preorder \
  -p 3000:3000 \
  -e DATABASE_URL="file:/app/prisma/dev.db" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret-key-here" \
  -v ./prisma/dev.db:/app/prisma/dev.db \
  sim-preorder
```

**Cara 2: Docker Compose (Recommended)**
```bash
# Jalankan dengan compose
docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🌐 Deploy ke Domain

### Opsi A: VPS/Cloud Server (DigitalOcean, AWS, dll)

#### 1. Setup Server
```bash
# SSH ke server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin
```

#### 2. Upload Project
```bash
# Di local, upload project
scp -r ./sim-preorder root@your-server-ip:/opt/

# Atau gunakan git
git clone https://github.com/yourusername/sim-preorder.git /opt/sim-preorder
```

#### 3. Konfigurasi Domain

**A. Update DNS:**
- Tambahkan A Record: `your-domain.com` → `your-server-ip`
- Tambahkan A Record: `www.your-domain.com` → `your-server-ip`

**B. Update nginx.conf:**
```bash
# Edit file nginx.conf
nano /opt/sim-preorder/nginx.conf

# Ganti your-domain.com dengan domain Anda
```

**C. Update docker-compose.yml:**
```yaml
environment:
  - NEXTAUTH_URL=https://your-domain.com
```

#### 4. SSL Certificate (Let's Encrypt)
```bash
# Install certbot
apt install certbot

# Generate SSL
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificate
mkdir -p /opt/sim-preorder/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/sim-preorder/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/sim-preorder/ssl/
```

#### 5. Jalankan
```bash
cd /opt/sim-preorder
docker-compose up -d
```

---

### Opsi B: Platform as a Service (Lebih Mudah)

#### Vercel (Gratis untuk hobby)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di dashboard
# - DATABASE_URL
# - NEXTAUTH_URL (https://your-app.vercel.app)
# - NEXTAUTH_SECRET
```

#### Railway / Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy otomatis

---

## 📝 Environment Variables untuk Production

Buat file `.env.production`:
```env
# Database - Gunakan database cloud seperti:
# - PlanetScale (MySQL)
# - Supabase (PostgreSQL)
# - Neon (PostgreSQL)
DATABASE_URL="mysql://user:password@host:3306/database"

# NextAuth - Ganti dengan domain production
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-random-string-min-32-chars"

# Web3 (opsional)
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/your-key"
PRIVATE_KEY="your-private-key"
CONTRACT_ADDRESS="your-contract-address"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🗄️ Database untuk Production

SQLite tidak disarankan untuk production. Gunakan:

### PlanetScale (MySQL - Gratis tier)
1. Buat akun di https://planetscale.com
2. Buat database baru
3. Copy connection string
4. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

### Supabase (PostgreSQL - Gratis tier)
1. Buat akun di https://supabase.com
2. Buat project baru
3. Copy connection string dari Settings > Database
4. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## ✅ Checklist Deployment

- [ ] Update `NEXTAUTH_URL` ke domain production
- [ ] Generate `NEXTAUTH_SECRET` baru (minimal 32 karakter)
- [ ] Setup database cloud (PlanetScale/Supabase)
- [ ] Update `DATABASE_URL` 
- [ ] Run `npx prisma migrate deploy` atau `npx prisma db push`
- [ ] Run seed data jika perlu
- [ ] Test semua fitur setelah deploy
- [ ] Setup SSL certificate
- [ ] Backup database secara berkala
