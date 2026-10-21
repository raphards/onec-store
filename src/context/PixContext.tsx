import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { 
  type PixKeyId, 
  type PixKeyItem, 
  IMMUTABLE_PIX_KEYS, 
  DEFAULT_PIX_KEY_ID, 
  generatePixPayload 
} from '../utils/pix';
import { useToast } from './ToastContext';

interface PixContextType {
  activeKeyId: PixKeyId;
  activeKey: PixKeyItem;
  keys: PixKeyItem[];
  isLoading: boolean;
  isSwitching: boolean;
  isContingencyModalOpen: boolean;
  setIsContingencyModalOpen: (open: boolean) => void;
  openContingencyModal: () => void;
  closeContingencyModal: () => void;
  switchActiveKey: (newKeyId: PixKeyId) => Promise<void>;
  generatePayload: (amount?: number, txid?: string) => string;
}

const PixContext = createContext<PixContextType | undefined>(undefined);

export const PixProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [activeKeyId, setActiveKeyId] = useState<PixKeyId>(() => {
    return (localStorage.getItem('onec_active_pix_key_id') as PixKeyId) || DEFAULT_PIX_KEY_ID;
  });

  const [keys, setKeys] = useState<PixKeyItem[]>(() => {
    return IMMUTABLE_PIX_KEYS.map((k) => ({
      ...k,
      isActive: k.id === activeKeyId,
    }));
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isContingencyModalOpen, setIsContingencyModalOpen] = useState(false);

  // Carrega configuração salva no backend/banco de dados
  const fetchConfig = useCallback(async () => {
    try {
      const data = await api.getPixConfig();
      setActiveKeyId(data.activeKeyId);
      setKeys(
        IMMUTABLE_PIX_KEYS.map((k) => ({
          ...k,
          isActive: k.id === data.activeKeyId,
        }))
      );
    } catch (err) {
      console.warn('Erro ao sincronizar chaves PIX do servidor:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Altera chave ativa com validação e toggle exclusivo (1 única ativa por vez)
  const switchActiveKey = async (newKeyId: PixKeyId) => {
    if (newKeyId === activeKeyId) return;

    const targetKey = IMMUTABLE_PIX_KEYS.find((k) => k.id === newKeyId);
    if (!targetKey) return;

    // Atualização otimista imediata para resposta ultrarrápida no PDV
    const prevKeyId = activeKeyId;
    setActiveKeyId(newKeyId);
    setKeys(
      IMMUTABLE_PIX_KEYS.map((k) => ({
        ...k,
        isActive: k.id === newKeyId,
      }))
    );
    setIsSwitching(true);

    try {
      await api.setActivePixKey(newKeyId);
      showToast(
        `Chave ativa alterada para ${targetKey.name} (${targetKey.formattedKey}). O QR Code foi atualizado!`,
        'success',
        'Contingência PIX Ativada'
      );
    } catch (err: any) {
      // Reverter se falhar
      setActiveKeyId(prevKeyId);
      setKeys(
        IMMUTABLE_PIX_KEYS.map((k) => ({
          ...k,
          isActive: k.id === prevKeyId,
        }))
      );
      showToast(
        err.message || 'Não foi possível alterar a chave PIX no servidor.',
        'error',
        'Erro na Contingência'
      );
    } finally {
      setIsSwitching(false);
    }
  };

  const activeKey = keys.find((k) => k.id === activeKeyId) || keys[0];

  const generatePayload = useCallback(
    (amount?: number, txid?: string): string => {
      return generatePixPayload({
        key: activeKey.key,
        type: activeKey.type,
        amount,
        merchantName: 'ONEC STORE',
        merchantCity: 'SAO PAULO',
        txid: txid || '***',
      });
    },
    [activeKey]
  );

  return (
    <PixContext.Provider
      value={{
        activeKeyId,
        activeKey,
        keys,
        isLoading,
        isSwitching,
        isContingencyModalOpen,
        setIsContingencyModalOpen,
        openContingencyModal: () => setIsContingencyModalOpen(true),
        closeContingencyModal: () => setIsContingencyModalOpen(false),
        switchActiveKey,
        generatePayload,
      }}
    >
      {children}
    </PixContext.Provider>
  );
};

export const usePix = (): PixContextType => {
  const context = useContext(PixContext);
  if (!context) {
    throw new Error('usePix deve ser utilizado dentro de um PixProvider');
  }
  return context;
};
