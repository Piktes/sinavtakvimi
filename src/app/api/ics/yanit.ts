import "server-only";

// .ics dosyalarının ortak yanıt kabuğu. Takvim istemcileri (Google/Apple)
// dosyayı düzenli aralıklarla yeniden çeker; içerik türü ve dosya adı
// doğru olmazsa bazıları akışı reddediyor.
export function icsYaniti(govde: string, dosyaAdi: string): Response {
  return new Response(govde, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // `inline` değil: tarayıcıdan tıklandığında takvime aktarılsın.
      "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
      // Tarih değişikliği takvimlere en geç yarım günde ulaşsın.
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}

export function bulunamadi(): Response {
  return new Response("Takvim bulunamadı.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Slug'lar URL'den geliyor; ".ics" uzantısıyla da istenebilsin diye ayıklanır.
export function slugTemizle(ham: string): string {
  return decodeURIComponent(ham).replace(/\.ics$/i, "");
}
