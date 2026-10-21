import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Award, 
  ArrowUpRight, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { usePix } from '../context/PixContext';
import type { DashboardStats } from '../types';

export const DashboardPage: React.FC = () => {
  const { activeKey, openContingencyModal } = usePix();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl p-4 border border-slate-200 h-28" />
          ))}
        </div>
        <div className="animate-pulse bg-white rounded-3xl p-6 border border-slate-200 h-64" />
      </div>
    );
  }

  // Calculate max daily revenue for chart scaling
  const maxDailyRevenue = Math.max(...stats.dailyStats.map((d) => d.revenue), 1);

  // Calculate payment breakdown percentages
  const pixStat = stats.paymentStats.find((p) => p.method === 'PIX') || { count: 0, total: 0 };
  const cashStat = stats.paymentStats.find((p) => p.method === 'DINHEIRO') || { count: 0, total: 0 };
  const totalPaymentSum = pixStat.total + cashStat.total || 1;
  const pixPercent = Math.round((pixStat.total / totalPaymentSum) * 100);
  const cashPercent = 100 - pixPercent;

  return (
    <div className="space-y-6">

      {/* Header with Refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Financeiro
          </h2>
          <p className="text-xs text-slate-500 font-medium">Métricas em tempo real integradas ao Neon</p>
        </div>

        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-transform active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Faturamento Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Total</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> acumulado total
            </span>
          </div>
        </motion.div>

        {/* Faturamento Hoje */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              R$ {stats.todayRevenue.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[11px] font-medium text-blue-600 mt-0.5 block">
              {stats.todaySalesCount} {stats.todaySalesCount === 1 ? 'venda hoje' : 'vendas hoje'}
            </span>
          </div>
        </motion.div>

        {/* Quantidade de Vendas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vendas Feitas</span>
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {stats.totalSalesCount}
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
              Transações registradas
            </span>
          </div>
        </motion.div>

        {/* Ticket Médio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              R$ {stats.averageTicket.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[11px] font-medium text-amber-600 mt-0.5 block">
              Média por pedido
            </span>
          </div>
        </motion.div>

      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Daily Sales Bar Chart (Last 7 Days) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Vendas por Dia</h3>
              <p className="text-xs text-slate-500">Faturamento dos últimos 7 dias</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              7 dias
            </span>
          </div>

          {/* Chart Bars */}
          <div className="pt-6 pb-2">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200">
              {stats.dailyStats.map((item, idx) => {
                const heightPercent = maxDailyRevenue > 0 ? (item.revenue / maxDailyRevenue) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-md mb-1">
                      R$ {item.revenue.toFixed(2).replace('.', ',')} ({item.count} un)
                    </div>

                    {/* Animated Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPercent, 4)}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="w-full max-w-[40px] rounded-t-xl bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition-colors shadow-2xs"
                    />

                    {/* X-axis Label */}
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors pt-1">
                      {item.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Payment Methods Split (PIX vs Dinheiro) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Métodos de Pagamento</h3>
            <p className="text-xs text-slate-500">Distribuição entre PIX e Dinheiro</p>
          </div>

          {/* Comparative Progress Bar */}
          <div className="space-y-2 py-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pixPercent}%` }}
                transition={{ duration: 0.6 }}
                className="bg-emerald-500 h-full"
                title={`PIX: ${pixPercent}%`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cashPercent}%` }}
                transition={{ duration: 0.6 }}
                className="bg-amber-500 h-full"
                title={`Dinheiro: ${cashPercent}%`}
              />
            </div>

            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-700">PIX ({pixPercent}%)</span>
              <span className="text-amber-700">Dinheiro ({cashPercent}%)</span>
            </div>
          </div>

          {/* Cards Breakdown */}
          <div className="space-y-2.5">
            {/* PIX Detail Card with Contingency status */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-950 block">PIX</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-200/70 text-emerald-800">
                      {activeKey.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700">{pixStat.count} transações</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-emerald-100/60">
                <button
                  type="button"
                  onClick={openContingencyModal}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                >
                  Alternar Chave
                </button>
                <span className="font-extrabold text-sm text-emerald-950">
                  R$ {pixStat.total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Dinheiro Detail Card */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 block">Dinheiro</span>
                  <span className="text-[11px] text-amber-700">{cashStat.count} transações</span>
                </div>
              </div>
              <span className="font-extrabold text-sm text-amber-950">
                R$ {cashStat.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Top Products Ranking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Top Produtos Mais Vendidos</h3>
            <p className="text-xs text-slate-500">Ranking por quantidade de unidades vendidas</p>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>

        {stats.topProducts.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Nenhum produto vendido ainda.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.topProducts.map((prod, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    idx === 0 ? 'bg-amber-400 text-slate-950 shadow-xs' :
                    idx === 1 ? 'bg-slate-300 text-slate-900' :
                    idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>

                  {prod.image && (
                    <img src={prod.image} alt={prod.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <span className="font-bold text-sm text-slate-900 truncate block">
                      {prod.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {prod.quantity} unidades comercializadas
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-sm text-slate-900">
                    R$ {Number(prod.revenue).toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600">receita gerada</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

    </div>
  );
};
