import Link from "next/link";
import { FileX } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { formatTarihAralik } from "@/lib/tarih";
import { IlanSatirEylemleri } from "./satir-eylemleri";

// §6: liste filtreleri — sezon, kurum, grup, format, zorluk, uygulama tipi,
// yayın durumu. Varsayılan sıralama sınav tarihi artan.
export default async function IlanlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRol(["ADMIN", "EDITOR"]);
  const p = await searchParams;

  const where: Prisma.IlanWhereInput = {};
  if (p.q) where.baslik = { contains: p.q, mode: "insensitive" };
  if (p.sezon) where.sezon = p.sezon;
  if (p.kurum) where.kurumId = p.kurum;
  if (p.grup) where.grupId = p.grup;
  if (p.format) where.formatId = p.format;
  if (p.zorluk) where.zorluk = p.zorluk as Prisma.IlanWhereInput["zorluk"];
  if (p.uygulama) where.uygulamaTipi = p.uygulama as Prisma.IlanWhereInput["uygulamaTipi"];
  if (p.yayin) where.yayinDurumu = p.yayin as Prisma.IlanWhereInput["yayinDurumu"];

  const [ilanlar, kurumlar, etiketler, sezonlar] = await Promise.all([
    prisma.ilan.findMany({
      where,
      select: {
        id: true,
        baslik: true,
        slug: true,
        sinavTarihi: true,
        sinavBitisTarihi: true,
        sezon: true,
        yayinDurumu: true,
        zorluk: true,
        kurum: { select: { ad: true } },
        format: { select: { ad: true } },
      },
      orderBy: { sinavTarihi: "asc" },
      take: 200,
    }),
    prisma.kurum.findMany({ select: { id: true, ad: true }, orderBy: { ad: "asc" } }),
    prisma.etiket.findMany({
      select: { id: true, ad: true, tip: true },
      orderBy: { sira: "asc" },
    }),
    prisma.ilan.findMany({
      select: { sezon: true },
      distinct: ["sezon"],
      orderBy: { sezon: "desc" },
    }),
  ]);

  const gruplar = etiketler.filter((e) => e.tip === "GRUP");
  const formatlar = etiketler.filter((e) => e.tip === "FORMAT");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-baslik text-2xl font-semibold text-text">İlanlar</h1>
        <div className="flex gap-2">
          <Button varyant="ikincil" boyut="sm">
            <Link href="/yonetim/ilanlar/toplu">Toplu seri girişi</Link>
          </Button>
          <Button boyut="sm">
            <Link href="/yonetim/ilanlar/yeni">Yeni ilan</Link>
          </Button>
        </div>
      </div>

      {p.olusturuldu && (
        <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
          {p.olusturuldu} ilan taslak olarak oluşturuldu.
        </p>
      )}

      {/* Filtreler GET formu — durum URL'de, paylaşılabilir. */}
      <Card>
        <form className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input name="q" defaultValue={p.q ?? ""} placeholder="Başlıkta ara…" />

          <Select name="sezon" defaultValue={p.sezon ?? ""} aria-label="Sezon">
            <option value="">Tüm sezonlar</option>
            {sezonlar.map((s) => (
              <option key={s.sezon} value={s.sezon}>
                {s.sezon}
              </option>
            ))}
          </Select>

          <Select name="kurum" defaultValue={p.kurum ?? ""} aria-label="Kurum">
            <option value="">Tüm kurumlar</option>
            {kurumlar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.ad}
              </option>
            ))}
          </Select>

          <Select name="grup" defaultValue={p.grup ?? ""} aria-label="Grup">
            <option value="">Tüm gruplar</option>
            {gruplar.map((g) => (
              <option key={g.id} value={g.id}>
                {g.ad}
              </option>
            ))}
          </Select>

          <Select name="format" defaultValue={p.format ?? ""} aria-label="Format">
            <option value="">Tüm formatlar</option>
            {formatlar.map((f) => (
              <option key={f.id} value={f.id}>
                {f.ad}
              </option>
            ))}
          </Select>

          <Select name="zorluk" defaultValue={p.zorluk ?? ""} aria-label="Zorluk">
            <option value="">Tüm zorluklar</option>
            <option value="KOLAY">Kolay</option>
            <option value="ORTA">Orta</option>
            <option value="ZOR">Zor</option>
          </Select>

          <Select name="uygulama" defaultValue={p.uygulama ?? ""} aria-label="Uygulama tipi">
            <option value="">Tümü</option>
            <option value="TURKIYE_GENELI">Türkiye Geneli</option>
            <option value="KURUMSAL">Kurumsal</option>
          </Select>

          <div className="flex gap-2">
            <Select name="yayin" defaultValue={p.yayin ?? ""} aria-label="Yayın durumu">
              <option value="">Tüm durumlar</option>
              <option value="TASLAK">Taslak</option>
              <option value="YAYINDA">Yayında</option>
              <option value="ARSIV">Arşiv</option>
            </Select>
            <Button type="submit" varyant="ikincil" boyut="md">
              Filtrele
            </Button>
          </div>
        </form>
      </Card>

      <p className="sayisal text-sm text-text-muted">{ilanlar.length} ilan</p>

      {ilanlar.length === 0 ? (
        <EmptyState
          ikon={FileX}
          baslik="Bu filtrelerde ilan yok"
          aciklama="Filtreleri gevşetin ya da yeni bir ilan oluşturun."
          eylem={
            <Button varyant="ikincil" boyut="sm">
              <Link href="/yonetim/ilanlar">Filtreleri temizle</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {ilanlar.map((ilan) => (
              <li key={ilan.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/yonetim/ilanlar/${ilan.id}`}
                    className="text-sm font-medium text-text hover:underline"
                  >
                    {ilan.baslik}
                  </Link>
                  <p className="text-xs text-text-muted">
                    {ilan.kurum.ad} · {ilan.format.ad} · {ilan.sezon}
                  </p>
                </div>

                <span className="sayisal shrink-0 text-sm text-text-muted">
                  {formatTarihAralik(ilan.sinavTarihi, ilan.sinavBitisTarihi)}
                </span>

                <Badge
                  varyant={
                    ilan.yayinDurumu === "YAYINDA"
                      ? "basari"
                      : ilan.yayinDurumu === "TASLAK"
                        ? "uyari"
                        : "notr"
                  }
                >
                  {ilan.yayinDurumu}
                </Badge>

                <IlanSatirEylemleri id={ilan.id} baslik={ilan.baslik} slug={ilan.slug} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
