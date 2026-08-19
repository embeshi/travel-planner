import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const duongDan = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  /* Bắt buộc cho GitHub Pages dạng project site: embeshi.github.io/travel-planner
     Sai chỗ này chỉ lộ ra lúc deploy, nên đặt ngay từ lô 1. */
  base: '/travel-planner/',

  plugins: [vue()],

  resolve: {
    alias: { '@': duongDan('./src') }
  },

  test: {
    /* Bài kiểm phần LOGIC chạy ở môi trường node cho nhanh (mặc định).
       Bài kiểm LINH KIỆN tự khai `@vitest-environment jsdom` ở đầu file. */
    setupFiles: ['./src/test-setup.js']
  },

  build: {
    rollupOptions: {
      input: {
        /* Trang app thật */
        main: duongDan('./index.html'),
        /* Trang bày linh kiện — tài liệu sống, giữ luôn sau này */
        'linh-kien': duongDan('./linh-kien.html'),
        /* Trang nghiệm thu dữ liệu — nghi thức bước 4 */
        'doi-chieu': duongDan('./doi-chieu.html')
      }
    }
  }
})
