# SFA Slack Bot — Deployment Ritual

## Architecture
```
Slack Client ←→ Bolt (Socket Mode) ←→ Salesforce (jsforce)
                    ↑
              PM2 on GCP VM (e2-micro, Debian 12)
```

## Prerequisites
- Node.js 22+, npm, git, gh CLI, gcloud CLI
- Slack App with Socket Mode enabled (tokens in .env)
- Salesforce Connected App or username/password+token
- GCP project with Compute Engine API enabled

## Repository
- **GitHub**: https://github.com/namit-jpg/SFA
- **GCP VM**: `sfa-slack-bot` (zone: `us-central1-c`, project: `govfund-app`)
- **External IP**: `34.41.120.197`

---

## Quick Deploy (After Code Changes)

```powershell
cd C:\Users\namit\Documents\SFA\sfa-slack-bot

# 1. Compile locally
npx tsc

# 2. Commit and push to GitHub
git add .
git commit -m "Description of changes"
git push origin master

# 3. Deploy to GCP VM
gcloud compute ssh sfa-slack-bot --zone=us-central1-c --command "cd /opt/sfa-slack-bot && sudo git pull origin master && sudo rm -rf dist && sudo npx tsc && sudo pm2 delete sfa-bot -f; sudo pm2 start dist/app.js --name sfa-bot && sudo pm2 save"
```

---

## Local Development

```powershell
cd C:\Users\namit\Documents\SFA\sfa-slack-bot
npm run dev
```

> **Important**: Stop local bot before using GCP bot to avoid duplicate Socket Mode connections.

---

## GCP VM — Manual Operations

### SSH into VM
```powershell
gcloud compute ssh sfa-slack-bot --zone=us-central1-c
```

### View bot logs
```bash
sudo pm2 logs sfa-bot --lines 20 --nostream
sudo cat /root/.pm2/logs/sfa-bot-error.log
sudo cat /root/.pm2/logs/sfa-bot-out.log
```

### Restart bot
```bash
sudo pm2 restart sfa-bot --update-env
```

### Stop/Start bot
```bash
sudo pm2 delete sfa-bot -f
sudo pm2 start /opt/sfa-slack-bot/dist/app.js --name sfa-bot
sudo pm2 save
```

### Check bot status
```bash
sudo pm2 status
```

### Update .env on VM
```powershell
# Create env file locally, then:
gcloud compute scp .env sfa-slack-bot:/tmp/sfa-env --zone=us-central1-c
gcloud compute ssh sfa-slack-bot --zone=us-central1-c --command "sudo mv /tmp/sfa-env /opt/sfa-slack-bot/.env && sudo pm2 restart sfa-bot --update-env"
```

### Deploy without GitHub (SCP compiled files)
```powershell
# When GitHub push is blocked (e.g., credential leaks):
gcloud compute scp --recurse dist sfa-slack-bot:/tmp/sfa-dist --zone=us-central1-c
gcloud compute ssh sfa-slack-bot --zone=us-central1-c --command "sudo rm -rf /opt/sfa-slack-bot/dist && sudo mv /tmp/sfa-dist /opt/sfa-slack-bot/dist && sudo pm2 restart sfa-bot --update-env"
```

---

## Environment Variables (.env)

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=rcg.dev@wd.in
SF_PASSWORD=<password+securitytoken>
SF_ACCESS_TOKEN=<optional-fallback-token>
SF_INSTANCE_URL=<optional-fallback-url>
PORT=3000
NODE_ENV=production
```

> **⚠ Password Security**: If password contains `#`, the rest is treated as a comment by dotenv. Wrap value in double quotes: `SF_PASSWORD="pass#token"`. Or use `SF_ACCESS_TOKEN` + `SF_INSTANCE_URL` from `sf org display` as fallback.

---

## SF CLI Commands (For Testing)

```powershell
# Set target org
sf config set target-org rcg-dms --global

# Query data
sf data query -q "SELECT Id, Name FROM SFA_User__c LIMIT 5"

# Create records
sf data create record -s Visit__c -v "Field1=Value1 Field2=Value2"

# Create sample visits (required fields: Visitor__c, SFA_User__c, AccountId__c)
sf data create record -s Visit__c -v "Visitor__c=<USER_ID> SFA_User__c=<SFA_USER_ID> Retail_Store_Custom__c=<STORE_ID> AccountId__c=<ACCOUNT_ID> Visit_Date__c=2026-05-13 PlannedDate__c=2026-05-13 Status__c='Planned' Type__c='Regular'"
```

---

## Picklist Values (Known Valid Values)

### Visit__c.Type__c
- `Regular`, `Ad hoc`, `Promotional`

### Visit__c.Status__c
- `Planned`, `In Progress`, `Completed`

### Visit_Survey_Response__c.Survey_Type__c
- `Market Survey`, `Retailer Feedback`

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `LOGIN_MUST_USE_SECURITY_TOKEN` | Wrong password/token | Reset security token in SF, update .env |
| `REQUIRED_FIELD_MISSING` on Visit__c | Missing `Visitor__c` or `AccountId__c` | Set both fields when creating visits |
| `RTF: Visit WD after Save` flow error | OwnerId/Visitor__c mapping failed | Use a User with read permission as `Visitor__c` |
| `CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY` | FLS/permission issue | Check field-level security for the bot user |
| Product dropdown empty | External select options not registered | Ensure `app.options()` handlers are in `appHome.ts` |
| Slack Home tab stale | Cached view | Quit Slack completely and reopen |
| `ack() already called` | Duplicate handlers | Check for duplicate `app.view()` registrations |
| `INVALID_LOGIN` repeatedly | Access token expired | Refresh via `sf org display` and update `SF_ACCESS_TOKEN` |

---

## Known Salesforce Objects (rcg-dms org)

| API Name | Label |
|----------|-------|
| `Visit__c` | Visit WD |
| `SFA_User__c` | SFA User |
| `RetailStore__c` | Retail Store Custom |
| `Beat__c` | Beat |
| `Beat_Plan_Line_Item__c` | Beat Plan Line Item |
| `Expense__c` | Expense |
| `Visit_Survey_Response__c` | Visit Survey Response |
| `Partner_Request__c` | Partner Request (Onboarding) |
| `Competing_Product__c` | Competing Product |
| `Return_Order__c` | Return Order |
| `Invoice__c` | Invoice Custom |
| `Inventory__c` | Inventory |
| `BulkClaim__c` | BulkClaim |

---

## Project Structure
```
sfa-slack-bot/
├── src/
│   ├── app.ts                          # Bolt entry point
│   ├── config.ts                       # Env config + SOBJECT constants
│   ├── salesforce/
│   │   ├── connection.ts               # jsforce connection + CRUD
│   │   └── soql.ts                     # Domain interfaces + 30+ queries
│   ├── home/
│   │   ├── router.ts                   # Page routing + state machine
│   │   ├── appHome.ts                  # Consolidated handlers (all actions + views)
│   │   └── views/
│   │       ├── homeView.ts             # Dashboard with metrics
│   │       ├── visitsView.ts           # Visit cards with filter
│   │       ├── visitDetailsView.ts     # Visit info, contact, notes, surveys
│   │       ├── visitInsightsView.ts    # 360 insights, frequent products, logs
│   │       ├── ordersView.ts           # Orders list
│   │       ├── accountsView.ts         # Accounts list
│   │       └── profileView.ts          # User profile + stats
│   ├── modals/
│   │   ├── createOrderModal.ts         # Product search + 8 qty slots
│   │   ├── surveyModal.ts              # 6-question survey form
│   │   ├── expenseModal.ts             # Category + amount + receipt
│   │   ├── adhocVisitModal.ts          # Store + date + purpose
│   │   ├── startVisitModal.ts          # Start visit confirmation
│   │   ├── endVisitModal.ts            # End visit summary
│   │   ├── beatPlanModal.ts            # Multi-rep + multi-store assignment
│   │   ├── competingNotesModals.ts     # Competing products, notes, reschedule
│   │   └── retailerOnboardingModal.ts  # 3-step onboarding wizard
│   ├── handlers/
│   │   ├── actions.ts                  # DEPRECATED — all handlers in appHome.ts
│   │   └── viewSubmissions.ts          # DEPRECATED — all handlers in appHome.ts
│   └── utils/
│       └── blocks.ts                   # Slack Block Kit builders
├── .env.example
├── slack-manifest.json                 # Slack app manifest for setup
├── package.json
└── tsconfig.json
```
