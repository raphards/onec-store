import { sql } from '../src/server/db.js';
import { SERVER_PIX_KEYS, DEFAULT_PIX_KEY_ID, isValidPixKeyId } from '../src/server/pixConfig.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    // GET: Recupera a chave ativa e a lista de chaves imutáveis
    if (req.method === 'GET') {
      let activeKeyId = DEFAULT_PIX_KEY_ID;

      try {
        const rows = await sql`
          SELECT value FROM app_settings WHERE key = 'active_pix_key_id' LIMIT 1
        `;
        if (rows.length > 0 && isValidPixKeyId(rows[0].value)) {
          activeKeyId = rows[0].value;
        }
      } catch (dbErr) {
        console.warn('Could not read active_pix_key_id from app_settings, using default:', dbErr);
      }

      const keysWithStatus = SERVER_PIX_KEYS.map((k) => ({
        ...k,
        isActive: k.id === activeKeyId,
      }));

      const activeKey = keysWithStatus.find((k) => k.id === activeKeyId) || keysWithStatus[0];

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          activeKeyId,
          activeKey,
          keys: keysWithStatus,
        })
      );
      return;
    }

    // POST: Alterna a chave ativa (toggle exclusivo)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { activeKeyId } = body;

      // Validação de segurança: As chaves são imutáveis e fixas no código/backend.
      // O frontend NUNCA pode enviar novas chaves ou editar os valores.
      if (!isValidPixKeyId(activeKeyId)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error:
              'Chave PIX inválida ou não autorizada. As chaves disponíveis são estritamente fixas e imutáveis no servidor.',
          })
        );
        return;
      }

      // Atualiza a chave ativa no banco Neon Postgres
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('active_pix_key_id', ${activeKeyId}, NOW())
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = NOW()
      `;

      const keysWithStatus = SERVER_PIX_KEYS.map((k) => ({
        ...k,
        isActive: k.id === activeKeyId,
      }));

      const activeKey = keysWithStatus.find((k) => k.id === activeKeyId) || keysWithStatus[0];

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          message: `Chave PIX alterada com sucesso para ${activeKey.name}`,
          activeKeyId,
          activeKey,
          keys: keysWithStatus,
        })
      );
      return;
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Método não permitido' }));
  } catch (error: any) {
    console.error('API /api/pix Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Erro ao processar chave PIX' }));
  }
}
