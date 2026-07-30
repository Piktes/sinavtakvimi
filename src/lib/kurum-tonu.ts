// §3.6: 45+ yayınevi var, admin her biri için renk seçmeyecek. Ton slug'dan
// deterministik üretilir — aynı yayınevi her yerde aynı renk.
//
// Doygunluk ve açıklık token'da SABİT (--kurum-doygunluk / --kurum-aciklik);
// yalnızca ton değişir. Bu sabitlik kritik: rastgele HSL üçlüsü kullanılırsa
// palet dağılır.
export function kurumTonu(slug: string): number {
  let h = 0;
  for (const karakter of slug) h = (h * 31 + karakter.charCodeAt(0)) % 360;
  return h;
}

// Bileşenlerde `style={kurumRengi(slug)}` olarak kullanılır; renk değeri
// yine token'lardan gelir, yalnızca ton değişkeni besleniyor (§3.1'e uygun —
// bileşen hex yazmıyor).
export function kurumRengi(slug: string): React.CSSProperties {
  return { "--kurum-h": kurumTonu(slug) } as React.CSSProperties;
}
