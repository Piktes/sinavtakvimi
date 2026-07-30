import { beforeAll, describe, expect, it } from "vitest";
import { imzaliJetonCoz, imzaliJetonUret } from "@/lib/imzali-baglanti";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-gizli-anahtar";
});

describe("imzalı bağlantı", () => {
  it("ürettiğini geri çözer", () => {
    const jeton = imzaliJetonUret({ abonelikId: "abc", eylem: "cik" });
    expect(imzaliJetonCoz(jeton)).toEqual({ abonelikId: "abc", eylem: "cik" });
  });

  it("gövdesi değiştirilen jetonu reddeder", () => {
    const jeton = imzaliJetonUret({ abonelikId: "abc" });
    const [, imza] = jeton.split(".");
    const sahteGovde = Buffer.from(JSON.stringify({ abonelikId: "baskasi" })).toString("base64url");
    expect(imzaliJetonCoz(`${sahteGovde}.${imza}`)).toBeNull();
  });

  it("imzası bozulan jetonu reddeder", () => {
    const jeton = imzaliJetonUret({ abonelikId: "abc" });
    const [govde] = jeton.split(".");
    expect(imzaliJetonCoz(`${govde}.sahteimza`)).toBeNull();
  });

  it("biçimsiz jetonu reddeder", () => {
    expect(imzaliJetonCoz("noktasiz")).toBeNull();
    expect(imzaliJetonCoz("")).toBeNull();
  });

  it("URL'de kaçış gerektirmeyen karakterler üretir", () => {
    const jeton = imzaliJetonUret({ eposta: "test@örnek.com", eylem: "doğrula" });
    expect(jeton).toBe(encodeURIComponent(jeton));
  });
});
