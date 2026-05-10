import { App, LogLevel } from '@slack/bolt';
import { config } from './config';
import { registerAppHome } from './home/appHome';
import { registerActions } from './handlers/actions';
import { registerViewSubmissions } from './handlers/viewSubmissions';

const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
  logLevel: config.nodeEnv === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  port: config.port,
});

// Register all handlers
registerAppHome(app);
registerActions(app);
registerViewSubmissions(app);

// Error handling
app.error(async (error) => {
  console.error('[Bolt] Global error:', error);
});

(async () => {
  console.log('═══════════════════════════════════════');
  console.log('  SFA Slack Bot — Starting...');
  console.log('  Environment:', config.nodeEnv);
  console.log('  Port:', config.port);
  console.log('  Mode: Socket Mode');
  console.log('═══════════════════════════════════════');

  await app.start(config.port);
  console.log(`[Bolt] ⚡ SFA Bot is running on port ${config.port}`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Bolt] Shutting down...');
    await app.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
