import dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from './db/database.js';
import { createBot } from './bot/bot.js';
import { createServer } from './api/server.js';
import { initScheduler } from './services/scheduler.js';

async function main() {
  console.log('🚀 Iniciando LinkStash...');

  // 1. Base de datos
  await initDatabase();

  // 2. Bot de Telegram
  const bot = createBot();
  if (bot) {
    bot.start({
      onStart: (botInfo) => {
        console.log(`🤖 Bot de Telegram iniciado como @${botInfo.username}`);
      }
    });
  }

  // 3. Cron jobs (Notifier)
  const sendFn = bot ? async (msg: string) => {
    const chatId = process.env.TELEGRAM_ALLOWED_USER_ID;
    if (chatId) {
      try {
        await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      } catch(e) {
        console.error('Error enviando digest por Telegram', e);
      }
    }
  } : undefined;
  initScheduler(sendFn);

  // 4. Web Dashboard Server
  const app = createServer();
  const PORT = process.env.PORT || 3500;

  app.listen(PORT, () => {
    console.log(`🌐 Dashboard web disponible en http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('💥 Error crítico al iniciar LinkStash:', err);
});
