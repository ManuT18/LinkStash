import { GoogleGenAI } from '@google/genai';
import { getAllCategories } from '../db/queries.js';

let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function categorizeLink(url: string, title: string, description: string): Promise<{ category: string; shortTitle: string }> {
  const categories = await getAllCategories();
  
  let fallbackCategory = 'Otros';

  // Fallback Rule-based categorization just in case Gemini fails
  const lowerUrl = url.toLowerCase();
  const textToAnalyze = `${title} ${description}`.toLowerCase();

  if (lowerUrl.includes('printables.com') || lowerUrl.includes('thingiverse.com') || lowerUrl.includes('makerworld.com')) {
    fallbackCategory = 'Impresión 3D';
  } else if (lowerUrl.includes('codepen.io') || lowerUrl.includes('dribbble.com') || lowerUrl.includes('behance.net')) {
    fallbackCategory = 'Diseño Web';
  } else {
    // Keyword match
    const categoryScores: { [categoryName: string]: number } = {};
    for (const cat of categories) {
      if (cat.name === 'Otros') continue;
      let score = 0;
      for (const kw of cat.keywords) {
        if (textToAnalyze.includes(kw.toLowerCase())) {
          score += 1;
        }
      }
      if (score > 0) categoryScores[cat.name] = score;
    }
    const sortedCategories = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      fallbackCategory = sortedCategories[0][0];
    }
  }

  // API Call to Gemini (con cascada de modelos para maximizar cuota disponible)
  if (aiClient) {
    const candidateModels = [
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-3.6-flash'
    ];

    const categoryNames = categories.map(c => c.name).join(', ');
    const prompt = `Analiza este enlace web y devuelve un objeto JSON con dos campos:
1. "categoria": Clasifica el recurso EXACTAMENTE en UNA de estas categorías: [${categoryNames}]. Si no encaja en ninguna, usa "Otros".
2. "titulo_corto": Extrae o deduce un título claro, legible y MUY CORTO (máximo 6 palabras) que identifique de qué trata la página. Ignora nombres largos por defecto de las webs, busca el tema central (ej: "Curso de Python", "TryHackMe: Linux", "GitHub: React Hooks").

Datos del enlace:
URL: ${url}
Título original: ${title}
Descripción: ${description}`;

    for (const modelName of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

        const text = response.text?.trim() || '{}';
        const parsed = JSON.parse(text);
        
        let finalCat = parsed.categoria || fallbackCategory;
        const isValidCategory = categories.some(c => c.name.toLowerCase() === finalCat.toLowerCase());
        if (!isValidCategory) finalCat = fallbackCategory;

        let finalTitle = parsed.titulo_corto || title;
        if (finalTitle.length > 70) finalTitle = finalTitle.substring(0, 67) + '...';

        return {
          category: finalCat,
          shortTitle: finalTitle
        };
      } catch (e: any) {
        console.warn(`[Categorizer] Modelo ${modelName} no disponible (${e.status || e.message}), probando siguiente...`);
      }
    }
  }

  // Fallback si no hay API key o todos los modelos fallaron
  return { category: fallbackCategory, shortTitle: title };
}
