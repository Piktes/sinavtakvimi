// `server-only` paketi Node'da içe aktarılınca hata fırlatır (amacı bu:
// sunucu modülünün istemci paketine sızmasını engellemek). Veritabanı
// testleri Node'da koşuyor ve tam da o sunucu modüllerini sınıyor, bu
// yüzden vitest.db.config.ts içinde bu boş modüle takılıyor.
export {};
