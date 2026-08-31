import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'linkstash.db');
const db = new sqlite3.Database(dbPath);

const newCategories = [
  { name: 'Ciberseguridad', emoji: '🛡️', keywords: ["cyber", "tryhackme", "redes", "certificaciones", "security", "hacking", "pentest", "vulnerabilidad", "infosec", "htb", "thm", "ciberseguridad", "ciber", "soc", "blueteam", "redteam", "cert"] },
  { name: 'Programación & IT', emoji: '💻', keywords: ["code", "python", "javascript", "typescript", "react", "node", "docker", "api", "backend", "git", "linux", "rust", "websites", "homelab", "sql", "database", "devops", "frontend", "server"] },
  { name: 'Herramientas & AI', emoji: '🛠️', keywords: ["tool", "app", "extension", "utility", "ai", "software", "saas", "generator", "repos", "github", "apps", "hardware", "claude", "chatgpt", "openai", "plugin", "notion"] },
  { name: 'Impresión 3D', emoji: '🖨️', keywords: ["3d", "print", "stl", "filament", "slicer", "cura", "bambu", "prusa", "ender", "cad", "fusion", "mesh"] },
  { name: 'Cursos & Roadmaps', emoji: '📚', keywords: ["course", "curso", "tutorial", "class", "learn", "aprender", "guide", "roadmap", "masterclass", "bootcamp"] },
  { name: 'Productividad & Tips', emoji: '📱', keywords: ["iphone", "atajo", "gastos", "finanzas", "tip", "truco", "hack", "productivity", "organización", "setup"] },
  { name: 'Entretenimiento', emoji: '🎮', keywords: ["game", "gaming", "meme", "funny", "music", "movie", "short", "humor", "viral"] },
  { name: 'Otros', emoji: '📦', keywords: [] }
];

db.serialize(() => {
  // Eliminar categorías viejas y crear nuevas
  db.run("DELETE FROM categories", (err) => {
    if (err) return console.error("Error borrando categorias", err);
    console.log("Categorias viejas eliminadas.");

    const stmt = db.prepare("INSERT INTO categories (name, emoji, keywords) VALUES (?, ?, ?)");
    for (const cat of newCategories) {
      stmt.run(cat.name, cat.emoji, JSON.stringify(cat.keywords));
    }
    stmt.finalize(() => {
      console.log("Nuevas categorias insertadas exitosamente.");
    });
  });

  // Migrar links existentes
  const mappings = {
    'Diseño Web': 'Programación & IT',
    'Cursos': 'Cursos & Roadmaps',
    'Herramientas': 'Herramientas & AI'
  };

  db.each("SELECT id, category, url FROM links", (err, row) => {
    if (err) return;
    
    let newCat = row.category;
    if (mappings[row.category]) {
      newCat = mappings[row.category];
    } else if (row.category === 'Otros') {
      if (row.url.includes('tryhackme') || row.url.includes('cyber')) newCat = 'Ciberseguridad';
      if (row.url.includes('notion') || row.url.includes('iphone')) newCat = 'Productividad & Tips';
    }

    if (newCat !== row.category) {
      db.run("UPDATE links SET category = ? WHERE id = ?", [newCat, row.id]);
    }
  }, () => {
    console.log("Links migrados exitosamente.");
    db.close();
  });
});
