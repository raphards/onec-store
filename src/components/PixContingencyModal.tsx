import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  QrCode, 
  Phone, 
  Mail, 
  AlertTriangle, 
  Copy, 
  Check, 
  Zap,
  Lock
} from 'lucide-react';
import { usePix } from '../context/PixContext';
import { useToast } from '../context/ToastContext';
import { QRCodeSVG } from 'qrcode.react';

export const PixContingencyModal: React.FC = () => {
  const { 
    isContingencyModalOpen, 
    closeContingencyModal, 
    keys, 
    activeKey, 
    activeKeyId, 
    switchActiveKey,
    generatePayload,
    isSwitching 
  } = usePix();
  const { showToast } = useToast();
  const [copiedKeyId, setCopiedKeyId] = React.useState<string | null>(null);

  if (!isContingencyModalOpen) return null;

  const handleCopyKey = (keyText: string, keyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(keyId);
    showToast(`Chave ${keyText} copiada para a área de transferência!`, 'info');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const previewPayload = generatePayload(10.00);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
        
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeContingencyModal}
          className="fixed inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold tracking-tight">
                    Chaves PIX e Contingência
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Ao Vivo
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Defina qual chave recebe os pagamentos do QR Code
                </p>
              </div>
            </div>

            <button
              onClick={closeContingencyModal}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Notice / Security Info */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block text-amber-950 mb-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Chaves Protegidas e Imutáveis
                </span>
                As chaves abaixo estão gravadas diretamente no código e no banco de dados para segurança máxima contra alterações indevidas. Use o <strong>toggle</strong> para alternar qual conta bancária deve receber os valores instantaneamente.
              </div>
            </div>

            {/* Contingency Toggles List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                <span>Chaves Cadastradas ({keys.length})</span>
                <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  1 Ativa no QR Code
                </span>
              </div>

              {keys.map((item) => {
                const isActive = item.id === activeKeyId;
                const isPhone = item.type === 'phone';

                return (
                  <motion.div
                    key={item.id}
                    layout
                    onClick={() => switchActiveKey(item.id)}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-md shadow-emerald-500/5'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Left: Bank Icon & Details */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      
                      {/* Bank Color Avatar */}
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm relative"
                        style={{ backgroundColor: item.bankColor }}
                      >
                        {isPhone ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                        {isActive && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-base">
                            {item.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeBg}`}>
                            {item.badgeText}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                              Ativa no QR Code
                            </span>
                          )}
                        </div>

                        {/* Key string + copy */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80">
                            {item.formattedKey}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyKey(item.key, item.id, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title="Copiar Chave"
                          >
                            {copiedKeyId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Toggle Switch */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className={`text-xs font-bold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {isActive ? 'Ativada' : 'Clique para ativar'}
                      </span>

                      {/* Interactive Switch Component */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isActive}
                        disabled={isSwitching}
                        onClick={(e) => {
                          e.stopPropagation();
                          switchActiveKey(item.id);
                        }}
                        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          isActive ? 'bg-emerald-600' : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                      >
                        <span className="sr-only">Ativar chave {item.name}</span>
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isActive ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </div>

            {/* Live QR Code Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                <QRCodeSVG
                  value={previewPayload}
                  size={90}
                  level="M"
                  includeMargin={false}
                  imageSettings={{
                    src: '/logo.png',
                    x: undefined,
                    y: undefined,
                    height: 18,
                    width: 18,
                    excavate: true,
                  }}
                />
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-extrabold text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Prévia do QR Code Dinâmico</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Qualquer venda finalizada no PDV agora utiliza a conta{' '}
                  <strong className="text-slate-800">{activeKey.name}</strong> ({activeKey.formattedKey}).
                </p>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                  Payload BACEN: {previewPayload.slice(0, 48)}...
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Modificações são sincronizadas imediatamente com todos os terminais.
            </span>
            <button
              onClick={closeContingencyModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-transform active:scale-95 shadow-xs"
            >
              Concluir e Voltar ao PDV
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
