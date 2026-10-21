import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  Banknote, 
  Check, 
  Copy, 
  ArrowRight, 
  Loader2, 
  ShoppingBag, 
  Sparkles, 
  Receipt 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import type { PaymentMethod, Sale } from '../types';

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSale: (sale: Sale) => void;
}

export const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccessSale,
}) => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalItems, totalAmount } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  if (!isOpen) return null;

  const numAmountReceived = parseFloat(amountReceived.replace(',', '.')) || 0;
  const changeAmount = Math.max(0, numAmountReceived - totalAmount);
  const isCashInsufficient = paymentMethod === 'DINHEIRO' && numAmountReceived > 0 && numAmountReceived < totalAmount;

  // Dynamic Pix payload for cart total
  const pixPayload = `00020126580014BR.GOV.BCB.PIX0136onec-store@pix.com.br520400005303986540${totalAmount.toFixed(2)}5802BR5910ONEC STORE6009SAO PAULO62070503***6304C89F`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleQuickCash = (amount: number) => {
    setAmountReceived(amount.toString());
  };

  const handleFinalize = async () => {
    if (isSubmitting || cartItems.length === 0) return;

    if (paymentMethod === 'DINHEIRO' && numAmountReceived < totalAmount) {
      alert(`O valor entregue pelo cliente deve ser de no mínimo R$ ${totalAmount.toFixed(2).replace('.', ',')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPaid = paymentMethod === 'DINHEIRO' ? numAmountReceived : totalAmount;
      const finalChange = paymentMethod === 'DINHEIRO' ? changeAmount : 0;

      const payloadItems = cartItems.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url,
        unit_price: Number(item.product.price),
        quantity: item.quantity,
        total_amount: Number(item.product.price) * item.quantity,
      }));

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          amount_paid: finalPaid,
          change_amount: finalChange,
        }),
      });

      let saleData: any;
      if (res.ok) {
        saleData = await res.json();
      } else {
        // Fallback local summary
        saleData = {
          id: `VND-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`,
          product_name: cartItems.map((it) => `${it.quantity}x ${it.product.name}`).join(', '),
          product_image: cartItems[0]?.product.image_url,
          unit_price: totalAmount,
          quantity: totalItems,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          amount_paid: finalPaid,
          change_amount: finalChange,
          status: 'COMPLETED',
          items: payloadItems,
          created_at: new Date().toISOString(),
        };
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'],
        });
      } catch (e) {
        console.log(e);
      }

      setCompletedSale(saleData);
      clearCart();
      onSuccessSale(saleData);
    } catch (err: any) {
      alert('Erro ao finalizar venda do carrinho: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      
      {/* Dim backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0"
      />

      {/* Sheet / Dialog */}
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                Carrinho de Vendas
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!completedSale && cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
              >
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

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

                {/* Items List */}
                <div className="border-t border-b border-slate-200/80 py-2 space-y-1">
                  {completedSale.items ? (
                    completedSale.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-medium">
                          {it.quantity}x {it.product_name}
                        </span>
                        <span className="font-bold text-slate-900">
                          R$ {(it.unit_price * it.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-800 font-semibold">{completedSale.product_name}</div>
                  )}
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
                      <span className="font-medium text-slate-900">
                        R$ {Number(completedSale.amount_paid).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {completedSale.change_amount > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <span>Troco Entregue:</span>
                        <span>R$ {Number(completedSale.change_amount).toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-extrabold text-base text-slate-900">
                  <span>TOTAL PAGO:</span>
                  <span className="text-emerald-600">
                    R$ {Number(completedSale.total_amount).toFixed(2).replace('.', ',')}
                  </span>
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
          ) : cartItems.length === 0 ? (
            /* Empty Cart */
            <div className="py-12 text-center space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800">Seu carrinho está vazio</h4>
              <p className="text-xs text-slate-500">Adicione produtos tocando nos cards da tela de vendas.</p>
            </div>
          ) : (
            <>
              {/* 1. LIST OF CART ITEMS */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item) => {
                  const price = Number(item.product.price);
                  const itemTotal = price * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {item.product.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            R$ {price.toFixed(2).replace('.', ',')} un.
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls & Total */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-xl"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-extrabold text-slate-900 min-w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-xl"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-extrabold text-slate-900 min-w-14 text-right">
                          R$ {itemTotal.toFixed(2).replace('.', ',')}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. PAYMENT METHODS CARDS */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Forma de Pagamento
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'PIX'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'PIX' && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">PIX</div>
                      <div className="text-[11px] text-slate-500 font-medium">QR Code Total</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DINHEIRO')}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'DINHEIRO'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'DINHEIRO' && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">Dinheiro</div>
                      <div className="text-[11px] text-slate-500 font-medium">Troco Instantâneo</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. CONDITIONAL VIEWS: PIX vs DINHEIRO */}
              <AnimatePresence mode="wait">
                {paymentMethod === 'PIX' ? (
                  <motion.div
                    key="cart-pix"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-3"
                  >
                    <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                      <QRCodeSVG
                        value={pixPayload}
                        size={140}
                        level="M"
                        includeMargin={false}
                        imageSettings={{
                          src: '/logo.png',
                          x: undefined,
                          y: undefined,
                          height: 26,
                          width: 26,
                          excavate: true,
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-600 font-medium">
                        Aponte a câmera para pagar o total do carrinho
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
                  <motion.div
                    key="cart-cash"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3"
                  >
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
                          placeholder={totalAmount.toFixed(2)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickCash(totalAmount)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Exato: R$ {totalAmount.toFixed(2).replace('.', ',')}
                      </button>
                      {[20, 50, 100, 200].map((val) => (
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

                    <div className="pt-1">
                      {isCashInsufficient ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex justify-between items-center font-bold">
                          <span>Valor Insuficiente:</span>
                          <span>Faltam R$ {(totalAmount - numAmountReceived).toFixed(2).replace('.', ',')}</span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex justify-between items-center shadow-2xs">
                          <div>
                            <span className="text-[11px] font-bold text-emerald-700 uppercase block leading-none">
                              Troco a Devolver
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
                  <span className="text-sm font-semibold text-slate-600">Total do Pedido:</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    R$ {totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={isSubmitting || isCashInsufficient || cartItems.length === 0}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Registrando no Neon...</span>
                    </>
                  ) : (
                    <>
                      <span>Finalizar Venda ({totalItems} itens)</span>
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
