import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Plugin to serve /api serverless endpoints during local development
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        try {
          // Collect body for POST/PUT
          if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
            const chunks: any[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            const bodyStr = buffer.toString('utf-8');
            try {
              (req as any).body = bodyStr ? JSON.parse(bodyStr) : {};
            } catch {
              (req as any).body = bodyStr;
            }
          }

          if (pathname === '/api/products' || pathname.startsWith('/api/products/')) {
            const { default: handler } = await import('./api/products.ts');
            return await handler(req, res);
          }
          if (pathname === '/api/sales' || pathname.startsWith('/api/sales/')) {
            const { default: handler } = await import('./api/sales.ts');
            return await handler(req, res);
          }
          if (pathname === '/api/stats' || pathname.startsWith('/api/stats/')) {
            const { default: handler } = await import('./api/stats.ts');
            return await handler(req, res);
          }
          if (pathname === '/api/upload' || pathname.startsWith('/api/upload/')) {
            const { default: handler } = await import('./api/upload.ts');
            return await handler(req, res);
          }
          if (pathname === '/api/init-db' || pathname.startsWith('/api/init-db/')) {
            const { default: handler } = await import('./api/init-db.ts');
            return await handler(req, res);
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
        } catch (err: any) {
          console.error('Dev API Error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), react(), apiDevPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
