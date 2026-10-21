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
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const paymentMethod = url.searchParams.get('payment_method');
      const search = url.searchParams.get('search');
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);

      let sales;
      if (paymentMethod && paymentMethod !== 'TODOS') {
        sales = await sql`
          SELECT * FROM sales 
          WHERE payment_method = ${paymentMethod}
          ORDER BY created_at DESC 
          LIMIT ${limit}
        `;
      } else {
        sales = await sql`
          SELECT * FROM sales 
          ORDER BY created_at DESC 
          LIMIT ${limit}
        `;
      }

      if (search && search.trim() !== '') {
        const query = search.toLowerCase();
        sales = sales.filter((s: any) =>
          s.product_name.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
        );
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(sales));
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        product_id,
        product_name,
        product_image,
        unit_price,
        quantity,
        total_amount,
        payment_method,
        amount_paid,
        change_amount,
        notes
      } = body;

      if (!product_name || !unit_price || !quantity || !total_amount || !payment_method) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Dados da venda incompletos.' }));
        return;
      }

      // Generate human-friendly sale ID, e.g. #VND-83921
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const saleId = `VND-${Date.now().toString().slice(-4)}${randomSuffix}`;

      const finalAmountPaid = amount_paid !== undefined ? Number(amount_paid) : Number(total_amount);
      const finalChangeAmount = change_amount !== undefined ? Number(change_amount) : Math.max(0, finalAmountPaid - Number(total_amount));

      const result = await sql`
        INSERT INTO sales (
          id,
          product_id,
          product_name,
          product_image,
          unit_price,
          quantity,
          total_amount,
          payment_method,
          amount_paid,
          change_amount,
          status,
          notes
        )
        VALUES (
          ${saleId},
          ${product_id || null},
          ${product_name},
          ${product_image || null},
          ${unit_price},
          ${quantity},
          ${total_amount},
          ${payment_method.toUpperCase()},
          ${finalAmountPaid},
          ${finalChangeAmount},
          'COMPLETED',
          ${notes || null}
        )
        RETURNING *
      `;

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result[0]));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Método não permitido' }));
  } catch (error: any) {
    console.error('Sales API Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Erro no servidor ao registrar venda' }));
  }
}
