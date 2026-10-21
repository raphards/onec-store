import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  X, 
  Check, 
  Loader2, 
  Eye, 
  EyeOff, 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../services/api';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { useToast } from '../context/ToastContext';
import type { Product } from '../types';

export const ProductsAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Bebidas');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [categories, setCategories] = useState<string[]>(['Bebidas', 'Lanches', 'Combos', 'Sobremesas', 'Geral']);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        api.getProducts(),
        api.getCategories().catch(() => ['Bebidas', 'Lanches', 'Combos', 'Sobremesas', 'Geral']),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSubmittingCategory(true);
    try {
      const added = await api.createCategory(newCategoryName.trim());
      setCategories((prev) => Array.from(new Set([...prev, added])).sort());
      setCategory(added);
      setNewCategoryName('');
      setIsAddingCategory(false);
      showToast(`Categoria "${added}" criada com sucesso!`, 'success');
    } catch (err: any) {
      showToast('Erro ao cadastrar categoria: ' + err.message, 'error');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openNewModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setCategory('Bebidas');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price.toString());
    setCategory(prod.category || 'Geral');
    setDescription(prod.description || '');
    setImageUrl(prod.image_url);
    setImageFile(null);
    setImagePreview(prod.image_url);
    setIsModalOpen(true);
    setPreviewProduct(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      showToast('Preencha o nome e o preço do produto.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        finalImageUrl = await api.uploadImage(imageFile);
      }

      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80';
      }

      const numPrice = parseFloat(price.replace(',', '.')) || 0;

      if (editingProduct) {
        await api.updateProduct({
          id: editingProduct.id,
          name,
          price: numPrice,
          category,
          description,
          image_url: finalImageUrl,
        });
        showToast(`Produto "${name}" atualizado com sucesso!`, 'success');
      } else {
        await api.createProduct({
          name,
          price: numPrice,
          category,
          description,
          image_url: finalImageUrl,
        });
        showToast(`Produto "${name}" cadastrado com sucesso!`, 'success');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast('Erro ao salvar produto: ' + (err.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active/inactive with optimistic UI update and toast
  const handleToggleActive = async (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const newActiveState = !prod.is_active;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, is_active: newActiveState } : p))
    );

    showToast(
      newActiveState
        ? `"${prod.name}" agora está ATIVO no PDV!`
        : `"${prod.name}" foi OCULTADO do PDV!`,
      'info'
    );

    try {
      await api.updateProduct({
        id: prod.id,
        is_active: newActiveState,
      });
    } catch (err) {
      console.error(err);
      // Revert if error
      fetchProducts();
    }
  };

  const handleOpenDelete = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProductToDelete(prod);
  };

  const handleConfirmDelete = async (id: number) => {
    try {
      await api.deleteProduct(id);
      showToast('Produto excluído com sucesso do catálogo!', 'success', 'Item Removido');
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      showToast('Erro ao excluir produto: ' + (err.message || 'Tente novamente'), 'error', 'Erro');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Catálogo de Produtos
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie visibilidade, preços e fotos no Neon Object Storage (bucket img-products)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Dedicated Page button */}
          <NavLink
            to="/cadastrar-produto"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Produto</span>
          </NavLink>

          <button
            onClick={openNewModal}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors shadow-2xs"
            title="Adicionar via Modal"
          >
            Novo Rápido
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl p-4 border border-slate-200 h-32" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-xs rounded-3xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-800">Nenhum produto cadastrado</h4>
          <p className="text-xs text-slate-500 mt-0.5">Clique em "Cadastrar Produto" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {products.map((prod) => {
            const price = Number(prod.price);
            const isActive = prod.is_active !== false;

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    : 'border-slate-200 bg-slate-50/80 opacity-75'
                }`}
              >
                {/* Top: Image, info and View Modal click */}
                <div 
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => setPreviewProduct(prod)}
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {!isActive && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center text-white">
                        <EyeOff className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-sm text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {prod.name}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                      {prod.category || 'Geral'}
                    </span>

                    <span className="text-base font-extrabold text-emerald-600 block mt-1">
                      R$ {price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Bottom Bar: Action Buttons & Visibility Switch */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  
                  {/* Status Toggle Switch with Label */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleActive(prod, e)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Alternar visibilidade no PDV"
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span>{isActive ? 'Ativo no PDV' : 'Oculto'}</span>
                  </button>

                  {/* Actions: View (Eye), Edit, Delete */}
                  <div className="flex items-center gap-1">
                    
                    {/* Visualizar / Olhinho */}
                    <button
                      type="button"
                      title="Visualizar Detalhes"
                      onClick={() => setPreviewProduct(prod)}
                      className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors shadow-2xs"
                    >
                      <Eye className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {/* Editar */}
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => openEditModal(prod)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Excluir */}
                    <button
                      type="button"
                      title="Excluir"
                      onClick={(e) => handleOpenDelete(prod, e)}
                      className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE VISUALIZAÇÃO DO PRODUTO (AO CLICAR NO OLHINHO)   */}
      {/* ======================================================== */}
      <AnimatePresence>
        {previewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 relative overflow-hidden space-y-4"
            >
              <button
                onClick={() => setPreviewProduct(null)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Large Image */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative shadow-sm">
                <img
                  src={previewProduct.image_url}
                  alt={previewProduct.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-slate-700 shadow-xs">
                  {previewProduct.category || 'Geral'}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Produto #{previewProduct.id}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    previewProduct.is_active !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {previewProduct.is_active !== false ? '● Visível no PDV' : '○ Oculto'}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {previewProduct.name}
                </h3>

                {previewProduct.description && (
                  <p className="text-xs text-slate-600 pt-0.5 leading-relaxed">
                    {previewProduct.description}
                  </p>
                )}

                <div className="pt-2 flex items-baseline justify-between border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Valor de Venda:
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    R$ {Number(previewProduct.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Vender Este Produto no PDV</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(previewProduct)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Dados</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewProduct(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Creation / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Suco de Laranja 500ml"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Price and Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Categoria *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory((v) => !v)}
                        className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs"
                        title="Cadastrar Nova Categoria"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    {isAddingCategory && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Nova categoria..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-none font-bold"
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingCategory(false)}
                            className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-700"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingCategory || !newCategoryName.trim()}
                            onClick={handleAddNewCategory}
                            className="px-2.5 py-0.5 text-[11px] bg-slate-900 text-white rounded-md font-bold"
                          >
                            {isSubmittingCategory ? '...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do produto..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Image Upload with Neon Storage */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Foto do Produto (Neon Object Storage - img-products)
                  </label>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-400 transition-colors bg-slate-50 relative">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-xl shadow-xs border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setImageUrl('');
                          }}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs font-bold text-slate-700 block">
                          Clique para enviar imagem
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          PNG, JPG até 5MB
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

                  {/* Or direct URL */}
                  <div className="mt-2">
                    <span className="text-[11px] text-slate-400 block mb-1">Ou cole uma URL direta da imagem:</span>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-transform active:scale-98 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando no Neon...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Salvar Produto</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Bonito de Confirmação de Exclusão */}
      <DeleteConfirmationModal
        product={productToDelete}
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
};
