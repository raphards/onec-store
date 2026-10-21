import { sql } from '../src/server/db.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // 1. Fetch from categories table
      const dbCategories = await sql`SELECT name FROM categories ORDER BY name ASC`;
      
      // 2. Fetch from existing products
      const prodCategories = await sql`SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''`;

      const allSet = new Set<string>();
      
      // Default base categories
      ['Bebidas', 'Lanches', 'Combos', 'Sobremesas', 'Geral'].forEach((c) => allSet.add(c));

      dbCategories.forEach((r: any) => {
        if (r.name?.trim()) allSet.add(r.name.trim());
      });
      prodCategories.forEach((r: any) => {
        if (r.category?.trim()) allSet.add(r.category.trim());
      });

      const categoriesList = Array.from(allSet).sort();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(categoriesList));
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name } = body;

      if (!name || !name.trim()) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Nome da categoria é obrigatório.' }));
        return;
      }

      const formattedName = name.trim();

      await sql`
        INSERT INTO categories (name) 
        VALUES (${formattedName}) 
        ON CONFLICT (name) DO NOTHING
      `;

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ name: formattedName, success: true }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Método não permitido' }));
  } catch (error: any) {
    console.error('Categories API Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Erro ao processar categorias' }));
  }
}
