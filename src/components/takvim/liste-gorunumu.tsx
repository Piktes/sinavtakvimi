import { IlanKarti } from "@/components/ilan-karti";
import { formatGunAdi, formatTarih } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

// §4.4: MOBİL VARSAYILANI. Tarih başlıklarıyla gruplu kart akışı — bir
// cumartesi hücresine 6 ilan sığmadığı için mobilde ızgara kullanılmaz.
// §4.5: sonsuz kaydırma yok, ay bazlı gezinme var.
export function ListeGorunumu({ ilanlar, simdi }: { ilanlar: IlanOzet[]; simdi: Date }) {
  const gruplar = new Map<string, IlanOzet[]>();
  for (const ilan of ilanlar) {
    const liste = gruplar.get(ilan.sinavTarihi);
    if (liste) liste.push(ilan);
    else gruplar.set(ilan.sinavTarihi, [ilan]);
  }

  return (
    <div className="flex flex-col gap-5">
      {[...gruplar.entries()].map(([gun, gununIlanlari]) => {
        const tarih = new Date(`${gun}T00:00:00.000Z`);
        return (
          <section key={gun} className="flex flex-col gap-2">
            <h3 className="sayisal sticky top-28 z-10 w-fit rounded-sm bg-bg-subtle px-2 py-1 text-sm font-medium text-text-muted">
              {formatTarih(tarih)} · {formatGunAdi(tarih)}
            </h3>
            {gununIlanlari.map((ilan) => (
              <IlanKarti key={ilan.id} ilan={ilan} simdi={simdi} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
