export type PaymentMethod = 'PIX' | 'DINHEIRO';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  category: string;
  is_active: boolean;
  created_at?: string;
}

export interface Sale {
  id: string;
  product_id?: number | null;
  product_name: string;
  product_image?: string | null;
  unit_price: number;
  quantity: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  status: string;
  notes?: string;
  created_at: string;
}

export interface DailyStat {
  dateLabel: string;
  fullDate: string;
  count: number;
  revenue: number;
}

export interface PaymentStat {
  method: string;
  count: number;
  total: number;
}

export interface TopProductStat {
  name: string;
  image?: string;
  quantity: number;
  revenue: number;
}

export interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalSalesCount: number;
  todaySalesCount: number;
  averageTicket: number;
  dailyStats: DailyStat[];
  paymentStats: PaymentStat[];
  topProducts: TopProductStat[];
}
