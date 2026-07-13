import { config } from '../config';
import { appendListItem } from './lists';

/** Best-effort client-visible proof: channel message and/or Slack Lists item. */
export async function demoProof(
  client: any | null | undefined,
  kind: string,
  summary: string,
  fields?: Record<string, string | number | null | undefined>
): Promise<void> {
  if (!config.demoMode) return;

  const lines = Object.entries(fields || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `• *${k}:* ${v}`)
    .join('\n');

  const text = `:test_tube: *Demo ${kind}*\n${summary}${lines ? `\n${lines}` : ''}`;

  if (client && config.demoProofChannel) {
    try {
      await client.chat.postMessage({
        channel: config.demoProofChannel,
        text: `Demo ${kind}: ${summary}`,
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text } },
          { type: 'context', elements: [{ type: 'mrkdwn', text: '_Stored in demo store (DEMO_MODE=true) — not Salesforce_' }] },
        ],
      });
    } catch (e) {
      console.error('[Demo] proof channel post failed:', e);
    }
  }

  if (client) {
    try {
      await appendListItem(client, kind, summary, fields || {});
    } catch (e) {
      console.error('[Demo] Slack Lists proof failed:', e);
    }
  }
}
