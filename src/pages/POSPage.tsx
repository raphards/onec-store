import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  Tag, 
  RefreshCw, 
  ShoppingBag, 
  Plus, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';
import { api } from '../services/api';
import type { Product, Sale } from '../types';
import { CheckoutModal } from '../components/CheckoutModal';

export const POSPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastSaleAlert, setLastSaleAlert] = useState<Sale | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Unique categories list
  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category || 'Geral')))];

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch && p.is_active !== false;
  });

  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSaleSuccess = (sale: Sale) => {
    setLastSaleAlert(sale);
    setTimeout(() => {
      setLastSaleAlert((current) => (current?.id === sale.id ? null : current));
    }, 6000);
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
      // Motion from different directions depending on index!
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
    <div className="space-y-5">

      {/* Sale Toast Notification */}
      <AnimatePresence>
        {lastSaleAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-18 right-4 z-40 max-w-sm bg-emerald-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-600"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold">Venda #{lastSaleAlert.id} Concluída!</p>
              <p className="opacity-90">
                {lastSaleAlert.quantity}x {lastSaleAlert.product_name} • R$ {Number(lastSaleAlert.total_amount).toFixed(2).replace('.', ',')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Controls: Search & Category Pills */}
      <div className="space-y-3">
        
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

      {/* Products Grid: Square Cards */}
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
                      // Fallback placeholder image
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80';
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
                      <span className="text-[10px] text-slate-400 font-semibold block leading-none">Preço</span>
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

      {/* Maquininha Checkout Modal */}
      <CheckoutModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccessSale={handleSaleSuccess}
      />

    </div>
  );
};
