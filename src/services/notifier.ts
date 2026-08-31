import { getStats, getLinks } from '../db/queries.js';

export async function sendDailyDigest(telegramSender?: (msg: string) => Promise<void>) {
  const stats = await getStats();
  if (stats.pending === 0) {
    console.log('⏰ Resumen diario: No hay links pendientes.');
    return;
  }

  const { links } = await getLinks({ status: 'pending', limit: 5 });
  let msg = `📬 **Resumen Diario de LinkStash**\n\nTenés **${stats.pending}** links pendientes por revisar.\n\n`;

  links.forEach((l, i) => {
    msg += `${i + 1}. [${l.title}](${l.url}) - \`${l.category}\`\n`;
  });

  if (telegramSender) {
    try {
      await telegramSender(msg);
    } catch (e) {
      console.error('Error enviando digest por Telegram:', e);
    }
  }
}
