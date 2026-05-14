require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const w = new WebClient(process.env.SLACK_BOT_TOKEN);
w.views.publish({
  user_id: 'U09S0DD7M16',
  view: { type: 'home', blocks: [{ type: 'section', text: { type: 'mrkdwn', text: ':white_check_mark: Refreshed! All visits cleared. Open Home tab.' } }] }
}).then(r => console.log('OK:', r.ok)).catch(e => console.log('FAIL:', e.message));
