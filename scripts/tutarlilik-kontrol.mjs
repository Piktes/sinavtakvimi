// §3.1 / §3.9: görsel tutarlılık denetimi. Her commit öncesi çalıştırılır
// (`pnpm tutarlilik`). Şartnamedeki iki grep'i uygular + bileşenlerde `dark:`
// ve ham `toLocaleDateString` kullanımını yakalar.
//
// Sıfırdan çıkış kodu = ihlal var demektir.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const KOK = path.join(process.cwd(), "src");
const TOKEN_DIZINI = path.join("src", "styles", "tokens");

const KURALLAR = [
  {
    ad: "styles/tokens/ dışında hex renk",
    desen: /#[0-9a-fA-F]{3,8}\b/,
    uzantilar: [".ts", ".tsx"],
    muaf: (dosya) => dosya.includes(TOKEN_DIZINI),
  },
  {
    ad: "serbest Tailwind değeri (p-[13px], bg-[#fff])",
    desen: /\[[0-9]+px\]|\[#/,
    uzantilar: [".tsx"],
  },
  {
    ad: "bileşende dark: öneki (yalnızca token dosyasında olmalı)",
    desen: /\bdark:/,
    uzantilar: [".tsx"],
    muaf: (dosya) => dosya.includes(TOKEN_DIZINI),
  },
  {
    ad: "ham toLocaleDateString (formatTarih* kullanılmalı)",
    desen: /toLocaleDateString|toLocaleTimeString/,
    uzantilar: [".ts", ".tsx"],
    muaf: (dosya) => dosya.endsWith(path.join("lib", "tarih.ts")),
  },
];

function* dosyalar(dizin) {
  for (const giris of readdirSync(dizin)) {
    const tamYol = path.join(dizin, giris);
    if (statSync(tamYol).isDirectory()) {
      if (giris === "generated" || giris === "node_modules") continue;
      yield* dosyalar(tamYol);
      continue;
    }
    yield tamYol;
  }
}

let ihlalSayisi = 0;

for (const dosya of dosyalar(KOK)) {
  const goreliYol = path.relative(process.cwd(), dosya);
  const uzanti = path.extname(dosya);
  const satirlar = readFileSync(dosya, "utf8").split("\n");

  for (const kural of KURALLAR) {
    if (!kural.uzantilar.includes(uzanti)) continue;
    if (kural.muaf?.(goreliYol)) continue;

    satirlar.forEach((satir, index) => {
      if (kural.desen.test(satir)) {
        console.error(`${goreliYol}:${index + 1}  ${kural.ad}\n    ${satir.trim()}`);
        ihlalSayisi += 1;
      }
    });
  }
}

if (ihlalSayisi > 0) {
  console.error(`\n${ihlalSayisi} tutarlılık ihlali bulundu (§3.1).`);
  process.exit(1);
}

console.log("Tutarlılık kontrolü temiz (§3.9).");
