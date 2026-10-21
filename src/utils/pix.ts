export type PixKeyId = 'santander' | 'mercadopago' | 'picpay';

export interface PixKeyItem {
  id: PixKeyId;
  name: string;
  key: string;
  type: 'phone' | 'email';
  bankName: string;
  description: string;
  bankColor: string;
  badgeBg: string;
  badgeText: string;
  formattedKey: string;
  isActive?: boolean;
}

/**
 * Chaves PIX imutáveis e embutidas diretamente no código/servidor.
 * Não podem ser alteradas, criadas ou excluídas pelo frontend.
 */
export const IMMUTABLE_PIX_KEYS: readonly PixKeyItem[] = [
  {
    id: 'santander',
    name: 'Santander',
    key: '21992192594',
    type: 'phone',
    bankName: 'Banco Santander',
    description: 'Chave celular Santander (Conta Principal)',
    bankColor: '#EC0000',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    badgeText: 'Telefone Celular',
    formattedKey: '(21) 99219-2594',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    key: 'raphagamesof@gmail.com',
    type: 'email',
    bankName: 'Mercado Pago',
    description: 'Chave e-mail Mercado Pago (Contingência 1)',
    bankColor: '#009EE3',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    badgeText: 'E-mail',
    formattedKey: 'raphagamesof@gmail.com',
  },
  {
    id: 'picpay',
    name: 'PicPay',
    key: 'caaccjnj@gmail.com',
    type: 'email',
    bankName: 'PicPay',
    description: 'Chave e-mail PicPay (Contingência 2)',
    bankColor: '#11C76F',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'E-mail',
    formattedKey: 'caaccjnj@gmail.com',
  },
] as const;

export const DEFAULT_PIX_KEY_ID: PixKeyId = 'santander';

/**
 * Calcula o checksum CRC16-CCITT (0xFFFF, 0x1021) do padrão EMVCo / Pix Banco Central
 */
export function calculatePixCrc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface GeneratePixOptions {
  key: string;
  type?: 'phone' | 'email';
  amount?: number;
  merchantName?: string;
  merchantCity?: string;
  txid?: string;
}

/**
 * Gera string Copia e Cola / QR Code Pix 100% válida de acordo com as normas do Banco Central do Brasil
 */
export function generatePixPayload(options: GeneratePixOptions): string {
  let rawKey = options.key.trim();
  if (options.type === 'phone' || (!options.type && /^\d{10,11}$/.test(rawKey))) {
    // Normalizar telefone para formato padrão internacional do Bacen (+55...)
    const digits = rawKey.replace(/\D/g, '');
    rawKey = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
  }

  const name = (options.merchantName || 'ONEC STORE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 25);

  const city = (options.merchantCity || 'SAO PAULO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15);

  const txid = (options.txid || '***').slice(0, 25);

  // Tag 26: Merchant Account Information
  const tag26 = formatTlv('00', 'BR.GOV.BCB.PIX') + formatTlv('01', rawKey);

  // Tag 62: Additional Data Field (txid)
  const tag62 = formatTlv('05', txid);

  let payload =
    formatTlv('00', '01') +
    formatTlv('01', '12') + // 12 = QR code estático dinâmico
    formatTlv('26', tag26) +
    formatTlv('52', '0000') +
    formatTlv('53', '986'); // BRL

  if (typeof options.amount === 'number' && options.amount > 0) {
    payload += formatTlv('54', options.amount.toFixed(2));
  }

  payload +=
    formatTlv('58', 'BR') +
    formatTlv('59', name) +
    formatTlv('60', city) +
    formatTlv('62', tag62) +
    '6304';

  const crc = calculatePixCrc16(payload);
  return `${payload}${crc}`;
}
