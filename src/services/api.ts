import type { Product, Sale, DashboardStats, PaymentMethod } from '../types';
import type { PixKeyId, PixKeyItem } from '../utils/pix';
import { IMMUTABLE_PIX_KEYS } from '../utils/pix';

const API_BASE = '/api';

export const api = {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Falha ao carregar produtos');
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('API getProducts fallback:', err);
      // Fallback local items if server is offline
      const cached = localStorage.getItem('onec_products');
      if (cached) return JSON.parse(cached);
      return [];
    }
  },

  // Categories
  async getCategories(): Promise<string[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error('Falha ao carregar categorias');
      return await res.json();
    } catch (err) {
      console.warn('API getCategories fallback:', err);
      return ['Bebidas', 'Lanches', 'Combos', 'Sobremesas', 'Geral'];
    }
  },

  async createCategory(name: string): Promise<string> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao cadastrar categoria');
    }
    const data = await res.json();
    return data.name;
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'is_active'>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar produto');
    }
    return await res.json();
  },

  async updateProduct(product: Partial<Product> & { id: number }): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar produto');
    }
    return await res.json();
  },

  async deleteProduct(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/products?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao excluir produto');
    }
  },

  // Sales
  async getSales(options?: { payment_method?: string; search?: string; limit?: number }): Promise<Sale[]> {
    try {
      const params = new URLSearchParams();
      if (options?.payment_method && options.payment_method !== 'TODOS') {
        params.append('payment_method', options.payment_method);
      }
      if (options?.search) {
        params.append('search', options.search);
      }
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }

      const res = await fetch(`${API_BASE}/sales?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar vendas');
      return await res.json();
    } catch (err) {
      console.warn('API getSales fallback:', err);
      const cached = localStorage.getItem('onec_sales');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async createSale(saleData: {
    product_id?: number | null;
    product_name: string;
    product_image?: string | null;
    unit_price: number;
    quantity: number;
    total_amount: number;
    payment_method: PaymentMethod;
    amount_paid: number;
    change_amount: number;
    notes?: string;
  }): Promise<Sale> {
    try {
      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao registrar venda');
      }

      const newSale: Sale = await res.json();
      
      // Update local storage backup
      const cached = localStorage.getItem('onec_sales');
      const sales: Sale[] = cached ? JSON.parse(cached) : [];
      sales.unshift(newSale);
      localStorage.setItem('onec_sales', JSON.stringify(sales.slice(0, 500)));

      return newSale;
    } catch (err: any) {
      // Local fallback in case network drops
      console.warn('Network issue, creating local sale fallback:', err);
      const fallbackSale: Sale = {
        id: `VND-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`,
        product_id: saleData.product_id,
        product_name: saleData.product_name,
        product_image: saleData.product_image,
        unit_price: Number(saleData.unit_price),
        quantity: Number(saleData.quantity),
        total_amount: Number(saleData.total_amount),
        payment_method: saleData.payment_method,
        amount_paid: Number(saleData.amount_paid),
        change_amount: Number(saleData.change_amount),
        status: 'COMPLETED',
        notes: saleData.notes,
        created_at: new Date().toISOString(),
      };

      const cached = localStorage.getItem('onec_sales');
      const sales: Sale[] = cached ? JSON.parse(cached) : [];
      sales.unshift(fallbackSale);
      localStorage.setItem('onec_sales', JSON.stringify(sales.slice(0, 500)));

      return fallbackSale;
    }
  },

  // Stats / Dashboard
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) throw new Error('Falha ao carregar métricas');
      return await res.json();
    } catch (err) {
      console.warn('API getStats fallback:', err);
      // Compute from cached sales if available
      const cached = localStorage.getItem('onec_sales');
      const sales: Sale[] = cached ? JSON.parse(cached) : [];
      
      const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total_amount), 0);
      const totalCount = sales.length;
      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter(s => s.created_at.startsWith(today));
      const todayRevenue = todaySales.reduce((acc, s) => acc + Number(s.total_amount), 0);

      return {
        totalRevenue,
        todayRevenue,
        totalSalesCount: totalCount,
        todaySalesCount: todaySales.length,
        averageTicket: totalCount > 0 ? totalRevenue / totalCount : 0,
        dailyStats: [],
        paymentStats: [
          { method: 'PIX', count: sales.filter(s => s.payment_method === 'PIX').length, total: sales.filter(s => s.payment_method === 'PIX').reduce((a, s) => a + Number(s.total_amount), 0) },
          { method: 'DINHEIRO', count: sales.filter(s => s.payment_method === 'DINHEIRO').length, total: sales.filter(s => s.payment_method === 'DINHEIRO').reduce((a, s) => a + Number(s.total_amount), 0) },
        ],
        topProducts: []
      };
    }
  },

  // Upload to Neon Object Storage bucket img-products
  async uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              fileData: base64,
              contentType: file.type,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Erro no upload de imagem');
          }

          const data = await res.json();
          resolve(data.url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  },

  // PIX Contingency Settings
  async getPixConfig(): Promise<{ activeKeyId: PixKeyId; activeKey: PixKeyItem; keys: PixKeyItem[] }> {
    try {
      const res = await fetch(`${API_BASE}/pix`);
      if (!res.ok) throw new Error('Falha ao obter configuração PIX');
      const data = await res.json();
      localStorage.setItem('onec_active_pix_key_id', data.activeKeyId);
      return data;
    } catch (err) {
      console.warn('API getPixConfig fallback:', err);
      const saved = (localStorage.getItem('onec_active_pix_key_id') as PixKeyId) || 'santander';
      const keys = IMMUTABLE_PIX_KEYS.map((k) => ({
        ...k,
        isActive: k.id === saved,
      }));
      const activeKey = keys.find((k) => k.id === saved) || keys[0];
      return { activeKeyId: saved, activeKey, keys };
    }
  },

  async setActivePixKey(activeKeyId: PixKeyId): Promise<{ activeKeyId: PixKeyId; activeKey: PixKeyItem; keys: PixKeyItem[] }> {
    localStorage.setItem('onec_active_pix_key_id', activeKeyId);
    try {
      const res = await fetch(`${API_BASE}/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeKeyId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao alterar chave PIX no servidor');
      }
      return await res.json();
    } catch (err) {
      console.warn('API setActivePixKey fallback to local state:', err);
      const keys = IMMUTABLE_PIX_KEYS.map((k) => ({
        ...k,
        isActive: k.id === activeKeyId,
      }));
      const activeKey = keys.find((k) => k.id === activeKeyId) || keys[0];
      return { activeKeyId, activeKey, keys };
    }
  },
};
