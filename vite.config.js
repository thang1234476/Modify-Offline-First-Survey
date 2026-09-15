import { defineConfig } from "vite";

// Chức năng: dùng chung cấu hình proxy cho dev server và preview server.
const proxyConfig = {
    "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
    }
};

export default defineConfig({
    // Chạy với `npm run dev`.
    server: {
        proxy: proxyConfig
    },

    // Chạy với `npm run preview`.
    preview: {
        proxy: proxyConfig
    }
});