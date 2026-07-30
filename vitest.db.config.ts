import path from "node:path";
import { defineConfig } from "vitest/config";

// Veritabanına dokunan testler ayrı yapılandırmada: `pnpm test` saf ve
// hızlı kalsın, CI'da DB olmadan da çalışsın. Bunlar `pnpm test:db`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.dbtest.ts"],
    setupFiles: ["test/db-kurulum.ts"],
    // Aynı satırlara yazan testler paralel koşarsa birbirini bozar.
    fileParallelism: false,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./test/bos-modul.ts"),
    },
  },
});
