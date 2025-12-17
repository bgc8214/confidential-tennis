import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/confidential-tennis/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: '테니스 동아리 스케줄 관리',
        short_name: '테니스 스케줄',
        description: '테니스 동아리의 매주 토요일 경기 스케줄을 자동으로 생성하고 관리하는 웹 애플리케이션',
        theme_color: '#2E7D4E',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/confidential-tennis/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
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
}))
