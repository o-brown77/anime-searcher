import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Конфигурация сборщика Vite.
 * Интегрирует плагин React для поддержки JSX/TSX и горячей перезагрузки (HMR).
 */
export default defineConfig({
  plugins: [react()],
});
