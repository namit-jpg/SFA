#!/bin/bash
set -e

echo "=== SFA Slack Bot - GCP Setup ==="

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt-get install -y nodejs git

# Clone and setup
cd /opt
git clone https://github.com/namit-jpg/SFA.git sfa-slack-bot || (cd sfa-slack-bot && git pull)
cd sfa-slack-bot
npm install --production

# Create .env template (fill real values via SSH)
cat > .env << 'ENVEOF'
SLACK_BOT_TOKEN=YOUR_BOT_TOKEN
SLACK_SIGNING_SECRET=YOUR_SIGNING_SECRET
SLACK_APP_TOKEN=YOUR_APP_TOKEN
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=rcg.dev@wd.in
SF_PASSWORD=YOUR_PASSWORD
PORT=3000
NODE_ENV=production
ENVEOF

# Compile TypeScript
npx tsc

# Setup PM2 for process management
npm install -g pm2
pm2 start dist/app.js --name sfa-bot
pm2 save
pm2 startup systemd -u root --hp /root

echo "=== Setup complete. Edit /opt/sfa-slack-bot/.env with real credentials, then: ==="
echo "  pm2 restart sfa-bot"
