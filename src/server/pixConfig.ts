export type PixKeyId = 'santander' | 'mercadopago' | 'picpay';

export interface PixKeyDefinition {
  id: PixKeyId;
  name: string;
  key: string;
  type: 'phone' | 'email';
  bankName: string;
  description: string;
}

/**
 * Definição imutável das 3 chaves PIX embutidas diretamente no código do backend/banco de dados.
 * Impossível de ser alterada através de requisições do frontend.
 */
export const SERVER_PIX_KEYS: readonly PixKeyDefinition[] = [
  {
    id: 'santander',
    name: 'Santander',
    key: '21992192594',
    type: 'phone',
    bankName: 'Banco Santander',
    description: 'Chave Celular Santander (Conta Principal)',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    key: 'raphagamesof@gmail.com',
    type: 'email',
    bankName: 'Mercado Pago',
    description: 'Chave E-mail Mercado Pago (Contingência 1)',
  },
  {
    id: 'picpay',
    name: 'PicPay',
    key: 'caaccjnj@gmail.com',
    type: 'email',
    bankName: 'PicPay',
    description: 'Chave E-mail PicPay (Contingência 2)',
  },
] as const;

export const DEFAULT_PIX_KEY_ID: PixKeyId = 'santander';

export function isValidPixKeyId(id: any): id is PixKeyId {
  return typeof id === 'string' && SERVER_PIX_KEYS.some((k) => k.id === id);
}

export function getPixKeyById(id: string): PixKeyDefinition | undefined {
  return SERVER_PIX_KEYS.find((k) => k.id === id);
}
