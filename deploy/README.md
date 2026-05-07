# Deployment Guide — vinaphone-m2m-api-gateway → EC2

## Architecture

```
Vercel (vinaphone-dashboard)
        │  HTTPS
        ▼
  EC2 Public IP / Domain
        │
     Nginx :443
        │
     NestJS API :3000 (Docker)
        │
   PostgreSQL :5432 (Docker)
```

---

## 1. EC2 instance setup (one-time)

```bash
# SSH into your EC2 instance, then:
bash deploy/setup-ec2.sh
```

> Requires Ubuntu 22.04+. Opens ports **80** and **443** in the EC2 Security Group.

---

## 2. SSL certificate (one-time)

Point your domain's **A record** to the EC2 public IP, then:

```bash
sudo certbot certonly --standalone -d your-domain.com

mkdir -p ~/vinaphone-m2m/certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/vinaphone-m2m/certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem   ~/vinaphone-m2m/certs/
sudo chown $USER:$USER ~/vinaphone-m2m/certs/*
```

Auto-renew cron (add via `crontab -e`):

```cron
0 3 * * * certbot renew --quiet --deploy-hook "docker compose -f ~/vinaphone-m2m/docker-compose.prod.yml restart nginx"
```

---

## 3. GitHub repository secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret        | Value                                                    |
| ------------- | -------------------------------------------------------- |
| `EC2_HOST`    | EC2 public IP or domain                                  |
| `EC2_USER`    | SSH username (e.g. `ubuntu`)                             |
| `EC2_SSH_KEY` | Contents of your `.pem` private key                      |
| `ENV_FILE`    | Full contents of your production `.env` file (see below) |

### Production `.env` template

```env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
FRONTEND_URL=https://your-vercel-dashboard.vercel.app

DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
POSTGRES_USER=vinaphone
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=vinaphone_m2m

JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=8h

VINAPHONE_API_BASE_URL=https://api.vinaphone.vn/m2m/v1
VINAPHONE_API_KEY=<your-key>
VINAPHONE_API_TIMEOUT_MS=10000

SYNC_CRON=*/10 * * * *

IMAGE_FULL=ghcr.io/<your-github-username>/vinaphone-m2m-api-gateway
IMAGE_TAG=latest
```

---

## 4. Deploy

Push to the `main` branch. GitHub Actions will:

1. Build the Docker image and push it to **GitHub Container Registry (ghcr.io)**
2. SSH into EC2, pull the new image, write the `.env`, and run `docker compose up -d`
3. The container CMD runs `prisma migrate deploy` then starts the NestJS app

---

## 5. Vercel dashboard configuration

In **vinaphone-dashboard** on Vercel, set the environment variable:

```
VITE_API_BASE_URL=https://your-domain.com/api/v1
```
