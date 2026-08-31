import { Bot } from 'grammy';
import { getLinks, getStats, getAllCategories } from '../db/queries.js';
import { sendDailyDigest } from '../services/notifier.js';

export function setupCommands(bot: Bot) {
  bot.command('start', async (ctx) => {
    const welcome = `👋 **¡Hola! Bienvenido a LinkStash.**\n\n` +
      `Enviame cualquier link de TikTok, YouTube Shorts, Instagram Reels, o sitios web y lo clasificaré y guardaré automáticamente en tu dashboard.\n\n` +
      `Comandos útiles:\n` +
      `/pending - Ver links pendientes\n` +
      `/stats - Ver estadísticas\n` +
      `/categories - Ver categorías disponibles\n` +
      `/digest - Probar el resumen de hoy`;
    await ctx.reply(welcome, { parse_mode: 'Markdown' });
  });

  bot.command('pending', async (ctx) => {
    const { links, total } = await getLinks({ status: 'pending', limit: 10 });
    if (total === 0) {
      return ctx.reply('🎉 ¡Felicidades! No tenés ningún link pendiente por revisar.');
    }

    let text = `📋 **Links Pendientes (${total} en total):**\n\n`;
    links.forEach((l, i) => {
      text += `${i + 1}. [${l.title}](${l.url}) - \`${l.category}\`\n`;
    });

    await ctx.reply(text, { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } });
  });

  bot.command('stats', async (ctx) => {
    const stats = await getStats();
    let text = `📊 **Estadísticas de LinkStash**\n\n` +
      `📦 Total guardados: ${stats.total}\n` +
      `⏳ Pendientes: ${stats.pending}\n` +
      `✅ Revisados: ${stats.reviewed}\n\n` +
      `**Por Categoría:**\n`;

    stats.byCategory.forEach((c: any) => {
      text += `• ${c.category}: ${c.count}\n`;
    });

    await ctx.reply(text, { parse_mode: 'Markdown' });
  });

  bot.command('categories', async (ctx) => {
    const cats = await getAllCategories();
    let text = `🏷️ **Categorías Disponibles:**\n\n`;
    cats.forEach(c => {
      text += `${c.emoji} **${c.name}**\n`;
    });
    await ctx.reply(text, { parse_mode: 'Markdown' });
  });

  bot.command('digest', async (ctx) => {
    await ctx.reply('🚀 Enviando digest...');
    await sendDailyDigest(async (msg: string) => {
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });
  });
}
