import { getDb } from './dist/db/database.js';
import { categorizeLink } from './dist/services/categorizer.js';
import { sanitizeUtf8 } from './dist/utils/sanitize.js';

function needsReprocessing(link) {
  if (!link.title || link.title === 'Sin título') return true;
  if (link.title.startsWith('http://') || link.title.startsWith('https://')) return true;
  if (link.title.includes(' on Instagram: "') || link.title.includes(' on TikTok: "')) return true;
  if (link.title.length > 50) return true;
  if (link.url.includes('tryhackme') && link.title === 'Sin título') return true;
  if (link.url.includes('linkedin') && link.category === 'Otros') return true;
  if (link.url.includes('tiktok') && link.title.includes('tiktok.com')) return true;
  return false;
}

async function reprocessAll() {
  console.log('🔄 Iniciando reprocesamiento de links pendientes con IA...\n');
  const db = await getDb();
  const allLinks = await db.all('SELECT * FROM links ORDER BY id ASC');

  const pendingLinks = allLinks.filter(needsReprocessing);

  console.log(`📊 Total en base de datos: ${allLinks.length} links.`);
  console.log(`🎯 Links que requieren optimización de título/categoría: ${pendingLinks.length}\n`);

  if (pendingLinks.length === 0) {
    console.log('🎉 ¡Todos los links ya tienen títulos cortos y categorías asignadas!');
    process.exit(0);
  }

  let updatedCount = 0;

  for (let i = 0; i < pendingLinks.length; i++) {
    const link = pendingLinks[i];
    console.log(`[${i + 1}/${pendingLinks.length}] Procesando ID ${link.id}: ${link.url}`);
    console.log(`   📌 Título actual: "${link.title.substring(0, 60)}..."`);
    console.log(`   🏷️  Categoría actual: [${link.category}]`);

    try {
      const result = await categorizeLink(link.url, link.title, link.description || '');
      const newTitle = sanitizeUtf8(result.shortTitle);
      const newCategory = result.category;

      await db.run(
        'UPDATE links SET title = ?, category = ? WHERE id = ?',
        [newTitle, newCategory, link.id]
      );

      console.log(`   ✨ Nuevo título: "${newTitle}"`);
      console.log(`   🎯 Nueva categoría: [${newCategory}]\n`);
      updatedCount++;
    } catch (err) {
      console.error(`   ❌ Error procesando link ${link.id}:`, err.message);
    }

    // Pausa preventiva de 2.5 segundos
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  console.log(`\n🎉 ¡Reprocesamiento completado! Se actualizaron ${updatedCount} links.`);
  process.exit(0);
}

reprocessAll().catch((err) => {
  console.error('Error fatal durante la ejecución:', err);
  process.exit(1);
});
