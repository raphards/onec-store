import { sql } from '../src/server/db.js';

export default async function handler(req: any, res: any) {
  // CORS & JSON headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const products = await sql`
        SELECT * FROM products 
        ORDER BY is_active DESC, category ASC, id ASC
      `;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(products));
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, price, image_url, category, description } = body;

      if (!name || price === undefined || !image_url) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Nome, preço e imagem são obrigatórios.' }));
        return;
      }

      const result = await sql`
        INSERT INTO products (name, description, price, image_url, category)
        VALUES (${name}, ${description || ''}, ${price}, ${image_url}, ${category || 'Geral'})
        RETURNING *
      `;

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result[0]));
      return;
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, name, price, image_url, category, description, is_active } = body;

      if (!id) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'ID do produto é obrigatório.' }));
        return;
      }

      const result = await sql`
        UPDATE products 
        SET 
          name = COALESCE(${name}, name),
          price = COALESCE(${price}, price),
          image_url = COALESCE(${image_url}, image_url),
          category = COALESCE(${category}, category),
          description = COALESCE(${description}, description),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result[0]));
      return;
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const id = url.searchParams.get('id');

      if (!id) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'ID do produto é obrigatório.' }));
        return;
      }

      await sql`DELETE FROM products WHERE id = ${id}`;

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'Produto removido com sucesso.' }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Método não permitido' }));
  } catch (error: any) {
    console.error('Products API Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Erro no servidor' }));
  }
}
