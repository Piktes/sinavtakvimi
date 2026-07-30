import { Star } from "lucide-react";

// §3.7: puan gösterimi tek bileşenden. Yıldızlar salt görsel — ekran
// okuyucuya sayısal değer veriliyor, beş ayrı simge okutulmuyor.
export function Yildiz({
  deger,
  boyut = 14,
  etiket,
}: {
  deger: number;
  boyut?: number;
  etiket?: string;
}) {
  const dolu = Math.round(deger);

  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={etiket ?? `${deger} / 5`}
    >
      {[1, 2, 3, 4, 5].map((sira) => (
        <Star
          key={sira}
          size={boyut}
          strokeWidth={1.75}
          aria-hidden
          className={sira <= dolu ? "fill-warning text-warning" : "text-text-faint"}
        />
      ))}
    </span>
  );
}
