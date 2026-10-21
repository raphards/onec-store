import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  Flame, 
  ShoppingBag, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Zap, 
  ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import type { Product, Sale, DashboardStats } from '../types';
import { CheckoutModal } from '../components/CheckoutModal';
import { CartCheckoutModal } from '../components/CartCheckoutModal';

export const POSPage: React.FC = () => {
  const { cartItems, totalItems, totalAmount, isCartOpen, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsData, statsData, catsData] = await Promise.all([
        api.getProducts(),
        api.getStats().catch(() => null),
        api.getCategories().catch(() => []),
      ]);
      setProducts(prodsData);
      setStats(statsData);
      setApiCategories(catsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute the TOP 2 best-selling products
  const activeProducts = products.filter((p) => p.is_active !== false);

  const getTop2Products = (): { product: Product; quantitySold?: number; rank: number }[] => {
    if (activeProducts.length === 0) return [];

    const topList: { product: Product; quantitySold?: number; rank: number }[] = [];
    const usedIds = new Set<number>();

    // 1. Try matching from stats.topProducts
    if (stats?.topProducts && stats.topProducts.length > 0) {
      for (const top of stats.topProducts) {
        const found = activeProducts.find(
          (p) => p.name.toLowerCase() === top.name.toLowerCase() && !usedIds.has(p.id)
        );
        if (found) {
          usedIds.add(found.id);
          topList.push({
            product: found,
            quantitySold: top.quantity,
            rank: topList.length + 1,
          });
        }
        if (topList.length === 2) break;
      }
    }

    // 2. Fallback: If less than 2, fill from activeProducts
    for (const p of activeProducts) {
      if (!usedIds.has(p.id)) {
        usedIds.add(p.id);
        topList.push({
          product: p,
          rank: topList.length + 1,
        });
      }
      if (topList.length === 2) break;
    }

    return topList;
  };

  const top2Products = getTop2Products();

  // Unique categories list (Todos + all dynamically registered categories)
  const categories = [
    'Todos',
    ...Array.from(new Set([...apiCategories, ...products.map((p) => p.category || 'Geral')]))
      .filter((c) => Boolean(c) && c !== 'Todos')
      .sort(),
  ];

  // Filtered products for main grid
  const filteredProducts = activeProducts.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSaleSuccess = (sale: Sale) => {
    // Refresh stats to immediately update top sellers
    api.getStats().then(setStats).catch(() => {});
  };

  const handleAddToCartToast = (product: Product, quantity: number) => {
    showToast(`${quantity}x ${product.name} adicionado ao carrinho!`, 'info', 'Carrinho de Vendas');
  };

  // Motion variants for dynamic entry from different directions
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: (index: number) => {
      const directions = [
        { y: 30, x: 0 },
        { y: -30, x: 0 },
        { x: -30, y: 0 },
        { x: 30, y: 0 },
      ];
      const dir = directions[index % directions.length];
      return { opacity: 0, x: dir.x, y: dir.y, scale: 0.95 };
    },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, damping: 20, stiffness: 260 },
    },
  };

  return (
    <div className="space-y-6">

      {/* 1. CONTROLES NO TOPO (NO LUGAR DA TOOLBAR NO MOBILE): BUSCA & PÍLULAS DE CATEGORIA */}
      <div className="space-y-3 pt-1 sm:pt-0">
        
        {/* Search input with sleek light look */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar produto por nome ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-slate-200/90 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills (horizontally scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shadow-2xs ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-102'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SEPARAÇÃO DOS 2 PRODUTOS MAIS VENDIDOS (ABAIXO DOS FILTROS) */}
      {!loading && top2Products.length > 0 && !searchQuery && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-emerald-50/50 p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-3"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                    Mais Vendidos • Atalhos Rápidos
                  </h3>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                    Top 2
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Toque para vender os produtos campeões de vendas
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full">
              <Zap className="w-3.5 h-3.5" /> 1-Toque
            </span>
          </div>

          {/* 2 Top Product Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {top2Products.map(({ product, quantitySold, rank }) => {
              const isFirst = rank === 1;
              const price = Number(product.price);

              return (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCardClick(product)}
                  className={`relative bg-white rounded-2xl p-3 sm:p-4 border-2 cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isFirst
                      ? 'border-amber-400 bg-linear-to-b from-amber-50/30 to-white'
                      : 'border-slate-300 bg-linear-to-b from-slate-50/40 to-white'
                  }`}
                >
                  {/* Top Rank Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full shadow-2xs ${
                        isFirst
                          ? 'bg-amber-400 text-amber-950 border border-amber-300'
                          : 'bg-slate-200 text-slate-800 border border-slate-300'
                      }`}
                    >
                      <Award className="w-3 h-3" />
                      {isFirst ? '1º Mais Vendido' : '2º Mais Vendido'}
                    </span>

                    {quantitySold !== undefined && quantitySold > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                        {quantitySold} un. vendidas
                      </span>
                    )}
                  </div>

                  {/* Thumbnail and Title */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 my-1">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block leading-none">Preço</span>
                      <span className="text-base sm:text-lg font-extrabold text-emerald-600 tracking-tight whitespace-nowrap block mt-0.5">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Main Products Grid: Square Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl p-3 border border-slate-200 shadow-xs space-y-3">
              <div className="w-full aspect-square bg-slate-200 rounded-2xl" />
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-5 bg-slate-200 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/70 backdrop-blur-xs rounded-3xl border border-slate-200 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `Nenhum resultado para "${searchQuery}". Tente outro termo.`
              : 'Nenhum produto cadastrado nesta categoria.'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4.5"
        >
          {filteredProducts.map((product, idx) => {
            const price = Number(product.price);
            return (
              <motion.div
                key={product.id}
                custom={idx}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick(product)}
                className="group relative bg-white/95 backdrop-blur-xs rounded-3xl p-3 sm:p-3.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all flex flex-col justify-between"
              >
                {/* Category Badge */}
                {product.category && (
                  <div className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-[10px] font-bold text-slate-700 shadow-2xs">
                    {product.category}
                  </div>
                )}

                {/* Quick Add Pill on Hover */}
                <div className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>

                {/* Square Product Image Container */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-3 relative border border-slate-100 group-hover:border-emerald-100 transition-colors">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-108"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>

                {/* Info Below Card: Title and Price */}
                <div className="flex flex-col justify-between flex-1 gap-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-emerald-800 transition-colors">
                    {product.name}
                  </h4>

                  <div className="pt-1 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block leading-none">
                        Preço
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-emerald-600 tracking-tight">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700 bg-slate-100 group-hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors">
                      Toque
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Maquininha Single Item Checkout Modal */}
      <CheckoutModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccessSale={handleSaleSuccess}
        onAddToCartToast={handleAddToCartToast}
      />

      {/* Floating Finalizar Venda Button (when cart has items) */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ y: 90, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 90, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 md:bottom-6 inset-x-4 max-w-md mx-auto z-40"
          >
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold shadow-xl shadow-emerald-700/35 flex items-center justify-between border border-emerald-400/40 transition-transform active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-slate-950 text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                    {totalItems}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-base font-extrabold block leading-tight">
                    Finalizar Venda
                  </span>
                  <span className="text-[11px] text-emerald-100 font-medium">
                    {cartItems.length} {cartItems.length === 1 ? 'produto no carrinho' : 'produtos no carrinho'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight">
                  R$ {totalAmount.toFixed(2).replace('.', ',')}
                </span>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Multi-Item Checkout Modal */}
      <CartCheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onSuccessSale={handleSaleSuccess}
      />

    </div>
  );
};
