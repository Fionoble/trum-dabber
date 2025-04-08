import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  server: {
    port: 3000,
    // You can also make it automatically open a different port if 3000 is in use
    strictPort: false,
  },
});
