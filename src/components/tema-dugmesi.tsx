"use client";

import { Moon, Sun } from "lucide-react";
import { useTransition } from "react";
import { temaSec } from "@/app/tercih-actions";
import { Button } from "@/components/ui/button";

// §5: açık/koyu tema her üç versiyonda zorunlu. Tercih çereze yazılır,
// SSR bir sonraki render'da <html data-tema> üzerine basar.
export function TemaDugmesi({ tema }: { tema: "acik" | "koyu" | null }) {
  const [beklemede, baslatGecis] = useTransition();
  const koyuMu = tema === "koyu";

  return (
    <Button
      varyant="hayalet"
      boyut="ikonSm"
      disabled={beklemede}
      aria-label={koyuMu ? "Açık temaya geç" : "Koyu temaya geç"}
      onClick={() =>
        baslatGecis(() => {
          void temaSec(koyuMu ? "acik" : "koyu");
        })
      }
    >
      {koyuMu ? (
        <Sun size={16} strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon size={16} strokeWidth={1.75} aria-hidden />
      )}
    </Button>
  );
}
