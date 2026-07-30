import { config } from "dotenv";

// Next.js .env'i kendisi yükler; vitest yüklemez.
config({ path: ".env", quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL yok — veritabanı testleri .env gerektirir.");
}
