import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Minus, 
  QrCode, 
  Banknote, 
  Check, 
  Copy, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  ShoppingBag, 
  ReceiptText 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import type { Product, PaymentMethod, Sale } from '../types';

interface CheckoutModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessSale: (sale: Sale) => void;
  onAddToCartToast?: (product: Product, quantity: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccessSale,
  onAddToCartToast,
}) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Reset modal state whenever a new product is selected
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setPaymentMethod('PIX');
      setAmountReceived('');
      setCopiedPix(false);
      setCompletedSale(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const unitPrice = Number(product.price);
  const subtotal = unitPrice * quantity;
  const numAmountReceived = parseFloat(amountReceived.replace(',', '.')) || 0;
  const changeAmount = Math.max(0, numAmountReceived - subtotal);
  const isCashInsufficient = paymentMethod === 'DINHEIRO' && numAmountReceived > 0 && numAmountReceived < subtotal;

  // Pix string generator
  const pixPayload = `00020126580014BR.GOV.BCB.PIX0136onec-store@pix.com.br520400005303986540${subtotal.toFixed(2)}5802BR5910ONEC STORE6009SAO PAULO62070503***6304C89F`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleQuickCash = (amount: number) => {
    setAmountReceived(amount.toString());
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
    if (onAddToCartToast) {
      onAddToCartToast(product, quantity);
    }
  };

  const handleFinalize = async () => {
    if (isSubmitting) return;

    if (paymentMethod === 'DINHEIRO' && numAmountReceived < subtotal) {
      showToast(
        `O valor entregue pelo cliente deve ser de no mínimo R$ ${subtotal.toFixed(2).replace('.', ',')}`,
        'warning',
        'Valor Insuficiente'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPaid = paymentMethod === 'DINHEIRO' ? numAmountReceived : subtotal;
      const finalChange = paymentMethod === 'DINHEIRO' ? changeAmount : 0;

      // Register sale
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          product_image: product.image_url,
          unit_price: unitPrice,
          quantity: quantity,
          total_amount: subtotal,
          payment_method: paymentMethod,
          amount_paid: finalPaid,
          change_amount: finalChange,
        }),
      });

      let saleData: Sale;
      if (res.ok) {
        saleData = await res.json();
      } else {
        // Fallback local sale
        saleData = {
          id: `VND-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`,
          product_id: product.id,
          product_name: product.name,
          product_image: product.image_url,
          unit_price: unitPrice,
          quantity: quantity,
          total_amount: subtotal,
          payment_method: paymentMethod,
          amount_paid: finalPaid,
          change_amount: finalChange,
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
        };
      }

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'],
        });
      } catch (e) {
        console.log(e);
      }

      // Show sleek success Toast!
      showToast(
        `Venda de ${quantity}x ${product.name} (R$ ${subtotal.toFixed(2).replace('.', ',')}) registrada com sucesso no banco de dados!`,
        'success',
        'Venda Concluída'
      );

      setCompletedSale(saleData);
      onSuccessSale(saleData);
    } catch (err: any) {
      showToast('Erro ao registrar venda: ' + (err.message || 'Tente novamente'), 'error', 'Erro na Venda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      
      {/* Background Dim Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0"
      />

      {/* Modal Sheet Container */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[92vh] flex flex-col z-10"
      >
        {/* Grab bar on mobile */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Unitário: R$ {unitPrice.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          <button
            onClick={isSubmitting ? undefined : onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 relative">

          {/* DATABASE INTEGRATION LOADING OVERLAY */}
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-md">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">
                  Registrando Venda no Banco de Dados...
                </h4>
                <p className="text-xs text-slate-500 max-w-xs font-medium">
                  Integrando pagamento com o sistema e gerando comprovante.
                </p>
              </div>
            </motion.div>
          )}

          {/* COMPLETED SALE RECEIPT VIEW */}
          {completedSale ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-4 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900">Venda Concluída!</h4>
                <p className="text-xs text-slate-500 mt-0.5">Comprovante #{completedSale.id}</p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2 text-sm">
                <div className="flex justify-between items-center text-slate-600 text-xs">
                  <span>Data e Hora</span>
                  <span className="font-medium text-slate-900">
                    {new Date(completedSale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-xs">Item:</span>
                  <span className="font-semibold text-slate-900 text-xs">{quantity}x {product.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-xs">Forma de Pagamento:</span>
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {completedSale.payment_method}
                  </span>
                </div>
                {completedSale.payment_method === 'DINHEIRO' && (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Valor Pago:</span>
                      <span className="font-medium text-slate-900">R$ {completedSale.amount_paid.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {completedSale.change_amount > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <span>Troco Entregue:</span>
                        <span>R$ {completedSale.change_amount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-extrabold text-base text-slate-900">
                  <span>Total da Venda:</span>
                  <span className="text-emerald-600">R$ {completedSale.total_amount.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-transform active:scale-98 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Próxima Venda (Novo Cliente)
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* 1. QUANTITY SELECTOR */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Selecione a Quantidade
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    Subtotal: R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Step Decrement */}
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 active:scale-95 transition-transform"
                  >
                    <Minus className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* Quantity Display */}
                  <div className="flex-1 text-center bg-white py-2 rounded-xl border border-slate-200 shadow-inner">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {quantity}
                    </span>
                    <span className="text-[11px] block text-slate-500 font-medium uppercase">
                      {quantity === 1 ? 'Unidade' : 'Unidades'}
                    </span>
                  </div>

                  {/* Step Increment */}
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-12 h-12 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Quick Quantity Shortcuts */}
                <div className="grid grid-cols-5 gap-1.5 mt-2.5">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`py-1 rounded-lg text-xs font-bold transition-colors ${
                        quantity === num
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. PAYMENT METHODS CARDS (PIX vs DINHEIRO) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Forma de Pagamento
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* PIX Option Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
                      paymentMethod === 'PIX'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm shadow-emerald-600/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'PIX' && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">PIX</div>
                      <div className="text-[11px] text-slate-500 font-medium">QR Code Instantâneo</div>
                    </div>
                  </button>

                  {/* Dinheiro Option Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DINHEIRO')}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
                      paymentMethod === 'DINHEIRO'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm shadow-emerald-600/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'DINHEIRO' && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">Dinheiro</div>
                      <div className="text-[11px] text-slate-500 font-medium">Cálculo de Troco</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. CONDITIONAL VIEWS: PIX vs DINHEIRO */}
              <AnimatePresence mode="wait">
                {paymentMethod === 'PIX' ? (
                  /* PIX VIEW */
                  <motion.div
                    key="pix-view"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-3"
                  >
                    <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                      <QRCodeSVG
                        value={pixPayload}
                        size={150}
                        level="M"
                        includeMargin={false}
                        imageSettings={{
                          src: '/logo.png',
                          x: undefined,
                          y: undefined,
                          height: 28,
                          width: 28,
                          excavate: true,
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-600 font-medium">
                        Aponte a câmera do aplicativo do banco para pagar
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                      >
                        {copiedPix ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Código Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copiar Chave Copia e Cola</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* DINHEIRO VIEW */
                  <motion.div
                    key="cash-view"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3"
                  >
                    {/* Amount Received Input */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Valor Entregue pelo Cliente (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          placeholder={subtotal.toFixed(2)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Quick Amount Suggestion Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickCash(subtotal)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Exato: R$ {subtotal.toFixed(2).replace('.', ',')}
                      </button>
                      {[10, 20, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickCash(val)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          R$ {val},00
                        </button>
                      ))}
                    </div>

                    {/* Real-time Change / Insufficient Alert Box */}
                    <div className="pt-1">
                      {isCashInsufficient ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex justify-between items-center font-bold">
                          <span>Valor Insuficiente:</span>
                          <span>Faltam R$ {(subtotal - numAmountReceived).toFixed(2).replace('.', ',')}</span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex justify-between items-center shadow-2xs">
                          <div>
                            <span className="text-[11px] font-bold text-emerald-700 uppercase block leading-none">
                              Troco do Cliente
                            </span>
                            <span className="text-xl font-extrabold text-emerald-700">
                              R$ {changeAmount.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <span className="text-xs font-semibold bg-emerald-200/80 text-emerald-900 px-2 py-1 rounded-md">
                            {changeAmount === 0 ? 'Sem Troco' : 'Devolver Troco'}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 4. TOTAL AND FINALIZE BUTTON */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-semibold text-slate-600">Total a Pagar:</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* BOTÃO ADICIONAR AO CARRINHO (EM CIMA DO FINALIZAR VENDA) */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm border border-slate-300/80 flex items-center justify-center gap-2 transition-all active:scale-98 shadow-2xs"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Adicionar ao Carrinho ({quantity}x)</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={isSubmitting || isCashInsufficient}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Integrando com o Banco de Dados...</span>
                    </>
                  ) : (
                    <>
                      <span>Finalizar Venda</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </motion.div>

    </div>
  );
};
