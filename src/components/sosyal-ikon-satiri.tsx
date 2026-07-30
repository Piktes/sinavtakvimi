import { SOSYAL_IKONLAR } from "@/components/sosyal-ikonlar";
import { SOSYAL_PLATFORM_ADLARI, type SosyalPlatform } from "@/lib/sosyal-platform";

export function SosyalIkonSatiri({
  baglantilar,
}: {
  baglantilar: { id: string; platform: string; url: string }[];
}) {
  if (baglantilar.length === 0) return null;

  return (
    <ul className="flex items-center gap-3">
      {baglantilar.map((baglanti) => {
        const platform = baglanti.platform as SosyalPlatform;
        const Ikon = SOSYAL_IKONLAR[platform];
        return (
          <li key={baglanti.id}>
            <a
              href={baglanti.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={SOSYAL_PLATFORM_ADLARI[platform]}
              className="text-text-muted transition-colors hover:text-text"
            >
              <Ikon size={18} strokeWidth={1.75} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
