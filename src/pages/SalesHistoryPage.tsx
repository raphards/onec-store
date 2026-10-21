import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpDown, 
  QrCode, 
  Banknote, 
  Printer, 
  X, 
  TrendingUp, 
  ChevronRight, 
  Clock, 
  ShoppingBag 
} from 'lucide-react';
import { api } from '../services/api';
import type { Sale } from '../types';

export const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'TODOS' | 'PIX' | 'DINHEIRO'>('TODOS');
  const [dateFilter, setDateFilter] = useState<'TODOS' | 'HOJE' | 'SEMANA'>('TODOS');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSales();
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filter sales
  const filteredSales = sales.filter((s) => {
    // Payment filter
    if (paymentFilter !== 'TODOS' && s.payment_method !== paymentFilter) {
      return false;
    }

    // Date filter
    if (dateFilter === 'HOJE') {
      const saleDate = new Date(s.created_at).toDateString();
      const today = new Date().toDateString();
      if (saleDate !== today) return false;
    } else if (dateFilter === 'SEMANA') {
      const saleTime = new Date(s.created_at).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (saleTime < sevenDaysAgo) return false;
    }

    // Search query
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const matchesName = s.product_name?.toLowerCase().includes(q);
      const matchesId = s.id?.toLowerCase().includes(q);
      return matchesName || matchesId;
    }

    return true;
  });

  const totalPeriodRevenue = filteredSales.reduce((acc, s) => acc + Number(s.total_amount), 0);
  const totalPeriodCount = filteredSales.length;

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner / Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Faturado</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              R$ {totalPeriodRevenue.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Nas vendas selecionadas</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Volume de Vendas</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              {totalPeriodCount} <span className="text-sm font-semibold text-slate-500">pedidos</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Vendas finalizadas no sistema</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do produto ou código da venda (ex: VND-1234)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          
          {/* Payment Method Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Método:</span>
            {(['TODOS', 'PIX', 'DINHEIRO'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentFilter(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  paymentFilter === m
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m === 'TODOS' ? 'Todos' : m === 'PIX' ? 'PIX' : 'Dinheiro'}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Período:</span>
            {(['TODOS', 'HOJE', 'SEMANA'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  dateFilter === d
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d === 'TODOS' ? 'Tudo' : d === 'HOJE' ? 'Hoje' : 'Últimos 7d'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-slate-200 shadow-xs h-20" />
          ))}
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-xs rounded-3xl border border-slate-200">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-800">Nenhuma venda encontrada</h4>
          <p className="text-xs text-slate-500 mt-0.5">Tente ajustar os filtros ou realizar uma nova venda no PDV.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSales.map((sale, idx) => {
            const isPix = sale.payment_method === 'PIX';
            const total = Number(sale.total_amount);
            const unitPrice = Number(sale.unit_price);
            const dateObj = new Date(sale.created_at);
            const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            return (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                onClick={() => setSelectedSale(sale)}
                className="bg-white/95 backdrop-blur-xs rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail / Method Icon */}
                  <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {sale.product_image ? (
                      <img src={sale.product_image} alt={sale.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    )}
                    <span 
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-tl-md flex items-center justify-center text-white ${
                        isPix ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    >
                      {isPix ? <QrCode className="w-2.5 h-2.5" /> : <Banknote className="w-2.5 h-2.5" />}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 truncate">
                        {sale.product_name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 shrink-0">
                        {sale.quantity}x
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-400 text-[11px]">#{sale.id}</span>
                      <span>•</span>
                      <span className="text-[11px]">{formattedDate} às {formattedTime}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Amount & Method badge */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-base sm:text-lg font-extrabold text-slate-900">
                      R$ {total.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[11px]">
                      <span className={`font-bold uppercase ${isPix ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {sale.payment_method}
                      </span>
                      {sale.change_amount > 0 && (
                        <span className="text-slate-400 text-[10px]">
                          (Troco: R$ {Number(sale.change_amount).toFixed(2).replace('.', ',')})
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Sale Detail / Printable Receipt Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden space-y-4"
            >
              <button
                onClick={() => setSelectedSale(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center border-b border-dashed border-slate-200 pb-4">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 mx-auto object-contain mb-2" />
                <h3 className="font-extrabold text-lg text-slate-900">OneC Store</h3>
                <p className="text-xs text-slate-500">Comprovante de Venda</p>
                <p className="text-[11px] font-mono font-bold text-slate-400 mt-1">#{selectedSale.id}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Data e Hora:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedSale.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Produto:</span>
                  <span className="font-bold text-slate-800 text-right">{selectedSale.product_name}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Quantidade:</span>
                  <span className="font-semibold text-slate-800">{selectedSale.quantity} un.</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Valor Unitário:</span>
                  <span className="font-medium text-slate-800">
                    R$ {Number(selectedSale.unit_price).toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Forma de Pagamento:</span>
                  <span className="font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {selectedSale.payment_method}
                  </span>
                </div>

                {selectedSale.payment_method === 'DINHEIRO' && (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Valor Entregue:</span>
                      <span className="font-semibold text-slate-800">
                        R$ {Number(selectedSale.amount_paid).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-emerald-700">
                      <span>Troco:</span>
                      <span>R$ {Number(selectedSale.change_amount).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-2 text-base font-extrabold text-slate-900">
                  <span>TOTAL PAGO:</span>
                  <span className="text-emerald-600">
                    R$ {Number(selectedSale.total_amount).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Comprovante
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
