import { App, LogLevel } from '@slack/bolt';
import { config, validateConfig } from './config';
import { registerAppHome } from './home/appHome';
import { initDemoStore, demoGetAllStores } from './demo/store';
import { bootstrapDemoLists, seedStoresList } from './demo/lists';
import { setProofClient } from './data';

const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
  logLevel: config.nodeEnv === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  port: config.port,
});

registerAppHome(app);

app.error(async (error) => { console.error('[Bolt]', error); });

(async () => {
  validateConfig();
  if (config.demoMode) {
    initDemoStore();
  }
  console.log('═══════════════════════════════════════');
  console.log('  SFA Slack Bot v2 - Starting...');
  console.log('  Environment:', config.nodeEnv);
  console.log('  Mode: Socket Mode');
  console.log('  Data:', config.demoMode ? 'DEMO (local store + auto Slack Lists)' : 'Salesforce');
  console.log('═══════════════════════════════════════');
  await app.start(config.port);
  console.log(`[Bolt] ⚡ SFA Bot v2 is running on port ${config.port}`);

  if (config.demoMode) {
    try {
      setProofClient(app.client);
      const reg = await bootstrapDemoLists(app.client);
      const ids = Object.entries(reg)
        .filter(([, m]) => m?.listId)
        .map(([k, m]) => `${k}=${m!.listId}`)
        .join(', ');
      if (ids) console.log(`[Demo Lists] Active: ${ids}`);
      await seedStoresList(app.client, demoGetAllStores());
    } catch (e) {
      console.error('[Demo Lists] Bootstrap error (demo store still works):', e);
    }
  }

  const shutdown = async () => { console.log('[Bolt] Shutting down...'); await app.stop(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
