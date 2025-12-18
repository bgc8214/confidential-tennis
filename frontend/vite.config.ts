import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/confidential-tennis/' : '/';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['seolha.png'],
        manifest: {
          name: '코트플래너 - 테니스 스케줄 관리',
          short_name: '코트플래너',
          description: '테니스 동아리의 매주 토요일 경기 스케줄을 자동으로 생성하고 관리하는 웹 애플리케이션',
          theme_color: '#10b981',
          background_color: '#f9fafb',
          display: 'standalone',
          orientation: 'portrait-primary',
          icons: [
            {
              src: `${base}seolha.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // 큰 파일(마스코트 이미지 등)도 캐시 허용
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
          // Supabase 요청은 캐싱하지 않음 (API 응답은 항상 최신이어야 함)
          runtimeCaching: []
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
