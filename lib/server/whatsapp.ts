import 'server-only';

/**
 * Orders always reach WhatsApp through the customer's own "Send order on
 * WhatsApp" tap (a wa.me link, no setup). When a provider is configured the
 * server also sends every new order straight to the shop's number:
 *
 *  - WhatsApp Cloud API (Meta Business): WHATSAPP_CLOUD_TOKEN + WHATSAPP_CLOUD_PHONE_ID.
 *    Free-form text only reaches a number that has messaged the business in the
 *    last 24 h; for guaranteed delivery create an approved template.
 *  - CallMeBot (free, for a personal number): CALLMEBOT_APIKEY.
 */

export function waLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export const autoNotifyConfigured = () =>
  !!(process.env.CALLMEBOT_APIKEY || (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_CLOUD_PHONE_ID));

/** Sends `text` to `number` if a provider is configured. Never throws; returns whether it was accepted. */
export async function notifyWhatsApp(number: string, text: string): Promise<boolean> {
  const to = number.replace(/\D/g, '');
  const signal = AbortSignal.timeout(8000);
  try {
    if (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_CLOUD_PHONE_ID) {
      const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_CLOUD_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text.slice(0, 4000) } }),
        signal,
      });
      if (res.ok) return true;
      console.error('[whatsapp] cloud api', res.status, await res.text().catch(() => ''));
    }
    if (process.env.CALLMEBOT_APIKEY) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${to}&text=${encodeURIComponent(text.slice(0, 3500))}&apikey=${encodeURIComponent(process.env.CALLMEBOT_APIKEY)}`;
      const res = await fetch(url, { signal });
      if (res.ok) return true;
      console.error('[whatsapp] callmebot', res.status);
    }
  } catch (err) {
    console.error('[whatsapp] notify failed', err);
  }
  return false;
}
