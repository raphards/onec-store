import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Check, 
  DollarSign, 
  Tag, 
  FileText, 
  ShoppingBag, 
  Sparkles, 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Image as ImageIcon 
} from 'lucide-react';
import { api } from '../services/api';

export const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Bebidas');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successCreated, setSuccessCreated] = useState<any | null>(null);

  const [categories, setCategories] = useState<string[]>(['Bebidas', 'Lanches', 'Combos', 'Sobremesas', 'Geral']);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  React.useEffect(() => {
    api.getCategories().then((data) => {
      if (data && data.length > 0) {
        setCategories(data);
        if (!data.includes(category)) {
          setCategory(data[0]);
        }
      }
    }).catch(console.error);
  }, []);

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSubmittingCategory(true);
    try {
      const added = await api.createCategory(newCategoryName.trim());
      setCategories((prev) => Array.from(new Set([...prev, added])).sort());
      setCategory(added);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (err: any) {
      alert('Erro ao cadastrar categoria: ' + err.message);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url.trim()) {
      setImagePreview(url);
      setImageFile(null);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }

    const numPrice = parseFloat(price.replace(',', '.')) || 0;
    if (numPrice <= 0) {
      alert('Por favor, informe um valor válido para o produto.');
      return;
    }

    if (!imagePreview && !imageUrl && !imageFile) {
      alert('Por favor, adicione uma foto para o produto.');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = imageUrl;

      // Upload file to Neon Object Storage bucket img-products via S3
      if (imageFile) {
        finalImageUrl = await api.uploadImage(imageFile);
      }

      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80';
      }

      const newProduct = await api.createProduct({
        name: name.trim(),
        price: numPrice,
        category: category.trim() || 'Geral',
        description: description.trim(),
        image_url: finalImageUrl,
      });

      setSuccessCreated(newProduct);
    } catch (err: any) {
      alert('Erro ao cadastrar produto: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setName('');
    setPrice('');
    setCategory('Bebidas');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    setSuccessCreated(null);
  };

  const numPrice = parseFloat(price.replace(',', '.')) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Cadastrar Produto
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Adicione itens ao catálogo com upload no Neon Storage
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors hidden sm:flex items-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ir para o PDV</span>
        </button>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {successCreated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Produto Cadastrado!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  "{successCreated.name}" já está disponível para venda na maquininha.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center gap-3 text-left">
                <img
                  src={successCreated.image_url}
                  alt={successCreated.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{successCreated.name}</h4>
                  <p className="text-xs font-extrabold text-emerald-600">
                    R$ {Number(successCreated.price).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-transform active:scale-98 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Vender Agora no PDV</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cadastrar Mais Um Produto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Grid: Form on Left, Live Card Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Form: 2 Cols */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 1. FOTO DO PRODUTO */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                1. Foto do Produto (Neon Object Storage - img-products) *
              </label>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 text-center bg-slate-50/70 transition-colors relative">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-36 h-36 object-cover rounded-2xl shadow-md border border-slate-200 mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setImageUrl('');
                      }}
                      className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1.5 shadow-md transition-colors"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      Clique para escolher a imagem
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      PNG, JPG ou WEBP até 5MB • Será salva no bucket <strong>img-products</strong>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Alternative: Direct Image URL */}
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Ou digite uma URL direta da imagem:
                </span>
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto-produto.jpg"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 2. NOME DO PRODUTO */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                2. Nome do Produto *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Coca-Cola Lata 350ml, X-Burger Smash..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm sm:text-base font-bold text-slate-900 placeholder:font-normal placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* 3. VALOR DO PRODUTO (R$) */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                3. Valor do Produto (Preço de Venda) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-extrabold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xl font-extrabold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* 4. CATEGORIA (LISTA SUSPENSA COM BOTÃO + PARA ADICIONAR) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
                  4. Categoria do Produto *
                </label>
                <span className="text-[11px] text-slate-400">
                  Define o filtro na tela de vendas
                </span>
              </div>

              {/* Dropdown Select + Button to Add New Category */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-2xs"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {/* Chevron down indicator */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>

                {/* + Button to Add New Category */}
                <button
                  type="button"
                  onClick={() => setIsAddingCategory((v) => !v)}
                  className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 active:scale-95 transition-all shrink-0"
                  title="Cadastrar Nova Categoria"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>

              {/* Inline Form to Add New Category */}
              <AnimatePresence>
                {isAddingCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">
                        Cadastrar Nova Categoria
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Sucos, Doces, Porções, Cafés..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={isSubmittingCategory || !newCategoryName.trim()}
                        onClick={handleAddNewCategory}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {isSubmittingCategory ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. DESCRIÇÃO (OPCIONAL) */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                5. Descrição / Detalhes (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Pão brioche, queijo cheddar derretido e molho especial da casa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando para o Neon Storage...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Cadastrar Produto Agora</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Live Card Preview (Exactly how it looks in PDV) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Pré-visualização no PDV
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
            <p className="text-[11px] text-slate-400">
              É assim que o produto aparecerá para os atendentes venderem na maquininha:
            </p>

            {/* Simulated PDV Square Card */}
            <div className="max-w-[240px] mx-auto bg-white rounded-3xl p-3.5 border-2 border-emerald-500/40 shadow-md relative flex flex-col justify-between">
              {/* Category Badge */}
              <div className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-[10px] font-bold text-slate-700 shadow-2xs">
                {category || 'Geral'}
              </div>

              {/* Square Image Container */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-3 relative border border-slate-100">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                    <ImageIcon className="w-10 h-10 mb-1" />
                    <span className="text-[10px] font-medium">Foto do Produto</span>
                  </div>
                )}
              </div>

              {/* Info Below Card */}
              <div className="flex flex-col justify-between flex-1 gap-1">
                <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight">
                  {name || 'Nome do Produto'}
                </h4>
                
                <div className="pt-1 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block leading-none">Preço</span>
                    <span className="text-lg font-extrabold text-emerald-600 tracking-tight">
                      R$ {numPrice > 0 ? numPrice.toFixed(2).replace('.', ',') : '0,00'}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                    Toque
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Pronto para venda com PIX e Dinheiro
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
