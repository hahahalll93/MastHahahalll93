import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://cmx.go.it', // 把请求转发到这个 Mastodon 实例
        changeOrigin: true,
        secure: true
      }
    }
  }
})