import { Bot, Context, InlineKeyboard } from 'grammy';
import { extractMetadata } from '../services/metadata.js';
import { categorizeLink } from '../services/categorizer.js';
import { saveLink, getAllCategories, updateLink, getLinkByUrl } from '../db/queries.js';
import { sanitizeUtf8, escapeHtml } from '../utils/sanitize.js';

export function setupHandlers(bot: Bot) {
  bot.on('message:entities:url', handleUrlMessage);
  bot.on('callback_query:data', handleCallbackQuery);
}

async function handleUrlMessage(ctx: Context) {
  if (!ctx.msg || !ctx.msg.text) return;
  
  const urls = ctx.entities('url');
  if (!urls || urls.length === 0) return;

  const entity = urls[0];
  const url = ctx.msg.text.slice(entity.offset, entity.offset + entity.length);

  // Verificar si ya fue guardado previamente
  const existing = await getLinkByUrl(url);
  if (existing) {
    const keyboard = await buildCategoryKeyboard(existing.category, existing.id);
    await ctx.reply(
      `⚠️ <b>Este link ya estaba guardado en tu colección.</b>\n\n` +
      `📌 <b>Título</b>: ${escapeHtml(sanitizeUtf8(existing.title))}\n` +
      `🏷️ <b>Categoría</b>: ${escapeHtml(existing.category)}\n` +
      `📊 <b>Estado</b>: ${existing.status === 'reviewed' ? 'Revisado ✅' : 'Pendiente ⏳'}`,
      { parse_mode: 'HTML', reply_markup: keyboard, reply_to_message_id: ctx.msg.message_id }
    );
    return;
  }

  const statusMsg = await ctx.reply('🔎 Procesando link y extrayendo información...', {
    reply_to_message_id: ctx.msg.message_id
  });

  try {
    const meta = await extractMetadata(url);
    const cleanTitle = sanitizeUtf8(meta.title);
    const cleanDesc = sanitizeUtf8(meta.description);
    const aiResult = await categorizeLink(url, cleanTitle, cleanDesc);
    const category = aiResult.category;
    const shortTitle = sanitizeUtf8(aiResult.shortTitle);

    let link;
    try {
      link = await saveLink({
        url,
        title: shortTitle, // Se guarda el título corto y mejorado
        description: cleanDesc,
        thumbnail: meta.thumbnail,
        platform: meta.platform,
        category
      });
    } catch (dbErr: any) {
      if (dbErr.message && dbErr.message.includes('UNIQUE constraint failed')) {
        await ctx.api.editMessageText(
          ctx.chat!.id,
          statusMsg.message_id,
          `⚠️ <b>Este link ya estaba guardado en tu colección.</b>`,
          { parse_mode: 'HTML' }
        );
        return;
      }
      throw dbErr;
    }

    const keyboard = await buildCategoryKeyboard(category, link.id);
    const responseText = buildResponseText({ title: shortTitle, platform: meta.platform }, category);

    try {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        responseText,
        { parse_mode: 'HTML', reply_markup: keyboard }
      );
    } catch (editErr) {
      // Fallback sin parse_mode si falla el parseo HTML/UTF-8
      console.warn('Error editando mensaje con HTML, reintentando plano:', editErr);
      await ctx.api.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        `✨ ¡Link guardado con éxito!\n📌 Título: ${shortTitle}\n🏷️ Categoría: ${category}`,
        { reply_markup: keyboard }
      );
    }
  } catch (e: any) {
    console.error('Error procesando link en Telegram:', e);
    await ctx.api.editMessageText(
      ctx.chat!.id,
      statusMsg.message_id,
      `❌ Ocurrió un error guardando el link: ${e.message || 'Error desconocido'}`
    );
  }
}

async function handleCallbackQuery(ctx: Context) {
  if (!ctx.callbackQuery || !ctx.callbackQuery.data) return;
  const data = ctx.callbackQuery.data;

  if (data.startsWith('set_cat:')) {
    await handleChangeCategory(ctx, data);
  } else if (data.startsWith('mark_rev:')) {
    await handleMarkReviewed(ctx, data);
  }
}

async function handleChangeCategory(ctx: Context, data: string) {
  const parts = data.split(':');
  const linkId = parseInt(parts[1], 10);
  const newCategory = parts[2];

  const updated = await updateLink(linkId, { category: newCategory });
  if (updated) {
    await ctx.answerCallbackQuery({ text: `Categoría cambiada a ${newCategory}` });
    await ctx.editMessageText(`✅ Categoría actualizada a: <b>${escapeHtml(newCategory)}</b>\n📌 ${escapeHtml(sanitizeUtf8(updated.title))}`, {
      parse_mode: 'HTML'
    });
  } else {
    await ctx.answerCallbackQuery({ text: 'No se pudo actualizar el link.' });
  }
}

async function handleMarkReviewed(ctx: Context, data: string) {
  const parts = data.split(':');
  const linkId = parseInt(parts[1], 10);

  const updated = await updateLink(linkId, { status: 'reviewed' });
  if (updated) {
    await ctx.answerCallbackQuery({ text: '¡Marcado como revisado!' });
    await ctx.editMessageText(`🎉 <b>¡Excelente!</b> Se marcó como revisado:\n📌 ${escapeHtml(sanitizeUtf8(updated.title))}`, {
      parse_mode: 'HTML'
    });
  } else {
    await ctx.answerCallbackQuery({ text: 'No se pudo actualizar.' });
  }
}

async function buildCategoryKeyboard(currentCategory: string, linkId: number): Promise<InlineKeyboard> {
  const categories = await getAllCategories();
  const keyboard = new InlineKeyboard();
  
  let colCount = 0;
  for (const cat of categories) {
    if (cat.name === currentCategory) continue;
    keyboard.text(`${cat.emoji} ${cat.name}`, `set_cat:${linkId}:${cat.name}`);
    colCount++;
    if (colCount % 2 === 0) keyboard.row();
  }
  keyboard.row().text('✅ Marcar como Revisado', `mark_rev:${linkId}`);
  return keyboard;
}

function buildResponseText(meta: { title: string; platform: string }, category: string): string {
  return `✨ <b>¡Link guardado con éxito!</b>\n\n` +
    `📌 <b>Título</b>: ${escapeHtml(meta.title)}\n` +
    `🏷️ <b>Categoría</b>: ${escapeHtml(category)}\n` +
    `🌐 <b>Plataforma</b>: ${escapeHtml(meta.platform.toUpperCase())}\n\n` +
    `¿Querés cambiar de categoría? Tocá un botón abajo:`;
}
