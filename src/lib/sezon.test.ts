import { describe, expect, it } from "vitest";
import { sezonTuret } from "@/lib/sezon";

const gun = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("sezonTuret", () => {
  it("Ağustos ve sonrası aynı yılın sezonuna sayılır", () => {
    expect(sezonTuret(gun("2026-10-30"))).toBe("2026-2027");
  });

  it("Ağustos'tan önce bir önceki sezona sayılır", () => {
    expect(sezonTuret(gun("2026-03-15"))).toBe("2025-2026");
  });

  it("kesme noktası 1 Ağustos — 31 Temmuz eski sezon", () => {
    expect(sezonTuret(gun("2026-07-31"))).toBe("2025-2026");
  });

  it("kesme noktası 1 Ağustos — 1 Ağustos yeni sezon", () => {
    expect(sezonTuret(gun("2026-08-01"))).toBe("2026-2027");
  });
});
