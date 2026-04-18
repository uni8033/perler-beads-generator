import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/generate': {
          target: 'https://api.siliconflow.cn/v1/images/generations',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/generate/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // 从 .env 文件读取，如果没有则使用备用默认 key，防止意外报错
              const apiKey = env.SILICONFLOW_API_KEY || 'sk-zqyofjdakvhsujaftchomlgdcqtspkyyvnydpdheyflrkzfr';
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
            });
          }
        }
      }
    }
  }
})
