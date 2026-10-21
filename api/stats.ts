import { sql } from '../src/server/db.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    // 1. Overall stats
    const totalStats = await sql`
      SELECT 
        COUNT(*)::int AS total_sales,
        COALESCE(SUM(total_amount), 0)::numeric(12,2) AS total_revenue,
        COALESCE(AVG(total_amount), 0)::numeric(12,2) AS average_ticket
      FROM sales
    `;

    // 2. Today's stats
    const todayStats = await sql`
      SELECT 
        COUNT(*)::int AS today_sales,
        COALESCE(SUM(total_amount), 0)::numeric(12,2) AS today_revenue
      FROM sales
      WHERE created_at >= CURRENT_DATE
    `;

    // 3. Last 7 days daily revenue & count
    const dailyStats = await sql`
      SELECT 
        TO_CHAR(d.day, 'DD/MM') AS date_label,
        TO_CHAR(d.day, 'YYYY-MM-DD') AS full_date,
        COUNT(s.id)::int AS count,
        COALESCE(SUM(s.total_amount), 0)::numeric(12,2) AS revenue
      FROM (
        SELECT CURRENT_DATE - i AS day 
        FROM generate_series(6, 0, -1) AS i
      ) d
      LEFT JOIN sales s ON DATE(s.created_at) = d.day
      GROUP BY d.day
      ORDER BY d.day ASC
    `;

    // 4. Payment method distribution
    const paymentStats = await sql`
      SELECT 
        payment_method,
        COUNT(*)::int AS count,
        COALESCE(SUM(total_amount), 0)::numeric(12,2) AS total
      FROM sales
      GROUP BY payment_method
    `;

    // 5. Top 5 selling products
    const topProducts = await sql`
      SELECT 
        product_name,
        product_image,
        SUM(quantity)::int AS total_quantity,
        SUM(total_amount)::numeric(12,2) AS total_revenue
      FROM sales
      GROUP BY product_name, product_image
      ORDER BY total_quantity DESC
      LIMIT 5
    `;

    const summary = {
      totalRevenue: Number(totalStats[0]?.total_revenue || 0),
      todayRevenue: Number(todayStats[0]?.today_revenue || 0),
      totalSalesCount: Number(totalStats[0]?.total_sales || 0),
      todaySalesCount: Number(todayStats[0]?.today_sales || 0),
      averageTicket: Number(totalStats[0]?.average_ticket || 0),
      dailyStats: dailyStats.map((d: any) => ({
        dateLabel: d.date_label,
        fullDate: d.full_date,
        count: Number(d.count),
        revenue: Number(d.revenue)
      })),
      paymentStats: paymentStats.map((p: any) => ({
        method: p.payment_method,
        count: Number(p.count),
        total: Number(p.total)
      })),
      topProducts: topProducts.map((p: any) => ({
        name: p.product_name,
        image: p.product_image,
        quantity: Number(p.total_quantity),
        revenue: Number(p.total_revenue)
      }))
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(summary));
  } catch (error: any) {
    console.error('Stats API Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Erro ao carregar estatísticas' }));
  }
}
