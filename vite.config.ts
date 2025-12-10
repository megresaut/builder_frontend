import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  server: {
    host: "::",
    port: 5173, // <-- UPDATED FROM 8080 TO 5173
    fs: {
      allow: [
        path.resolve(__dirname), // client/
        path.resolve(__dirname, "../shared"), // shared/
      ],
    },
  },

  build: {
    outDir: "dist/spa",
    emptyOutDir: true,
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
  },
});
