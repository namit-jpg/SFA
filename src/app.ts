import { App, LogLevel } from '@slack/bolt';
import { config } from './config';
import { registerAppHome } from './home/appHome';

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
  console.log('═══════════════════════════════════════');
  console.log('  SFA Slack Bot v2 — Starting...');
  console.log('  Environment:', config.nodeEnv);
  console.log('  Mode: Socket Mode');
  console.log('═══════════════════════════════════════');
  await app.start(config.port);
  console.log(`[Bolt] ⚡ SFA Bot v2 is running on port ${config.port}`);

  const shutdown = async () => { console.log('[Bolt] Shutting down...'); await app.stop(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
