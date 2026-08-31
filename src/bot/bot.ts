import { Bot } from 'grammy';
import { setupCommands } from './commands.js';
import { setupHandlers } from './handlers.js';

export function createBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_telegram_bot_token_here') {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN no fue provisto. El bot de Telegram estará deshabilitado.');
    return null;
  }

  const bot = new Bot(token);

  // Seguridad: Solo permitir al usuario dueño
  const allowedUser = process.env.TELEGRAM_ALLOWED_USER_ID;
  if (allowedUser) {
    bot.use(async (ctx, next) => {
      if (ctx.from?.id.toString() !== allowedUser) {
        console.warn(`[Seguridad] Bloqueado intento de acceso de Telegram ID: ${ctx.from?.id}`);
        return; // Ignorar silenciosamente
      }
      await next();
    });
  } else {
    console.warn('⚠️ TELEGRAM_ALLOWED_USER_ID no configurado. ¡Cualquiera puede usar el bot!');
  }

  setupCommands(bot);
  setupHandlers(bot);

  bot.catch((err) => {
    console.error('Error en Telegram Bot:', err);
  });

  return bot;
}
