import cron from 'node-cron';
import { sendDailyDigest } from './notifier.js';

export function initScheduler(botSendFn?: (msg: string) => Promise<void>) {
  const digestTime = process.env.DIGEST_HOUR || '20:00';
  const [hour, minute] = digestTime.split(':');

  const cronPattern = `${minute || '0'} ${hour || '20'} * * *`;

  cron.schedule(cronPattern, async () => {
    console.log('⏰ Ejecutando cron job de resumen diario...');
    await sendDailyDigest(botSendFn);
  });

  console.log(`⏰ Cron job de resumen diario programado para las ${digestTime} hs diariamente.`);
}
