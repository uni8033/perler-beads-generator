import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/.netlify/functions/generateImage': {
          target: 'https://api.siliconflow.cn/v1/images/generations',
          changeOrigin: true,
          rewrite: () => '', // Remove the path entirely since we are hitting the root of the target URL
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Read from .env, or use fallback for local dev if missing
              const apiKey = env.SILICONFLOW_API_KEY || 'sk-zqyofjdakvhsujaftchomlgdcqtspkyyvnydpdheyflrkzfr';
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
            });
          }
        }
      }
    }
  }
})
