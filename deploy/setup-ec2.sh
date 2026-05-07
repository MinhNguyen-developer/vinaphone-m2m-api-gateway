#!/usr/bin/env bash
# EC2 one-time bootstrap script
# Run as: bash setup-ec2.sh
set -euo pipefail

echo "=== Installing Docker ==="
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker

# Allow current user to run docker without sudo
sudo usermod -aG docker "$USER"

echo "=== Installing Certbot (Let's Encrypt) ==="
sudo apt-get install -y snapd
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Point your domain's A record to this EC2 public IP."
echo "  2. Open ports 80 and 443 in your EC2 Security Group."
echo "  3. Obtain an SSL certificate:"
echo "       sudo certbot certonly --standalone -d your-domain.com"
echo "  4. Copy the certs into ~/vinaphone-m2m/certs/:"
echo "       mkdir -p ~/vinaphone-m2m/certs"
echo "       sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/vinaphone-m2m/certs/"
echo "       sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem   ~/vinaphone-m2m/certs/"
echo "       sudo chown \$USER:\$USER ~/vinaphone-m2m/certs/*"
echo "  5. Create ~/vinaphone-m2m/.env from the template (see README)."
echo "  6. Run the GitHub Actions workflow to deploy."
