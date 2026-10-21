import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_1pBRvjnYi0Iq@ep-proud-truth-b57i2ihi-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const sql = neon(connectionString);

/**
 * Initializes the database tables and populates initial products & categories if empty.
 */
export async function initDb() {
  try {
    // 1. Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 2. Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        image_url TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'Geral',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 3. Create sales table
    await sql`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(50) PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image TEXT,
        unit_price NUMERIC(10, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_amount NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        amount_paid NUMERIC(10, 2) NOT NULL,
        change_amount NUMERIC(10, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'COMPLETED',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 4. Create index for fast date querying
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
    `;

    // 5. Seed default categories if empty
    const catCountRes = await sql`SELECT COUNT(*)::int AS count FROM categories`;
    if ((catCountRes[0]?.count || 0) === 0) {
      const defaultCategories = ['Bebidas', 'Lanches', 'Combos', 'Sobremesas', 'Geral'];
      for (const cat of defaultCategories) {
        await sql`
          INSERT INTO categories (name) 
          VALUES (${cat}) 
          ON CONFLICT (name) DO NOTHING
        `;
      }
    }

    // 6. Seed default products if empty
    const productCountResult = await sql`SELECT COUNT(*)::int AS count FROM products`;
    const count = productCountResult[0]?.count || 0;

    if (count === 0) {
      console.log('Seeding initial products into Neon Postgres...');
      const seedProducts = [
        {
          name: 'Coca-Cola Lata 350ml',
          description: 'Refrigerante Coca-Cola original gelada',
          price: 6.00,
          image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
          category: 'Bebidas'
        },
        {
          name: 'Água Mineral 500ml',
          description: 'Água mineral natural sem gás gelada',
          price: 4.00,
          image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
          category: 'Bebidas'
        },
        {
          name: 'Heineken Long Neck',
          description: 'Cerveja premium puro malte 330ml',
          price: 12.00,
          image_url: 'https://images.unsplash.com/photo-1608270191024-bc6810a990a4?auto=format&fit=crop&w=600&q=80',
          category: 'Bebidas'
        },
        {
          name: 'Energético Red Bull 250ml',
          description: 'Red Bull Energy Drink original gelado',
          price: 14.00,
          image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
          category: 'Bebidas'
        },
        {
          name: 'Hambúrguer Smash Artesanal',
          description: 'Pão brioche, 2x smash burger 90g, queijo cheddar e molho especial',
          price: 28.00,
          image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
          category: 'Lanches'
        },
        {
          name: 'Porção Batata Rústica',
          description: 'Batatas crocantes com alecrim e maionese da casa',
          price: 18.00,
          image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
          category: 'Lanches'
        },
        {
          name: 'Combo Smash + Batata + Refri',
          description: 'Smash burger + batata rústica individual + refri lata',
          price: 42.00,
          image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80',
          category: 'Combos'
        },
        {
          name: 'Açaí Tropical 400ml',
          description: 'Açaí cremoso com leite em pó, banana e granola',
          price: 16.00,
          image_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
          category: 'Sobremesas'
        }
      ];

      for (const prod of seedProducts) {
        await sql`
          INSERT INTO products (name, description, price, image_url, category)
          VALUES (${prod.name}, ${prod.description}, ${prod.price}, ${prod.image_url}, ${prod.category})
        `;
      }
      console.log('Initial products seeded successfully.');
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
