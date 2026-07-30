import { X as XIkon } from "lucide-react";
import type { SosyalPlatform } from "@/lib/sosyal-platform";

// §3.7 istisnası: Lucide 1.x'te marka ikonları (Instagram/Facebook/YouTube/
// TikTok/WhatsApp) yok — bu sürümde kaldırılmışlar. Aşağıdakiler Lucide'ın
// çizgi/stroke estetiğine (24x24, stroke="currentColor", yuvarlak uçlar)
// bilerek uydurulmuş minimal ikonlar; genel Lucide seti yerine burada,
// tek dosyada, gerekçesiyle tutuluyor. "X" platformu için gerçek Lucide
// `X` ikonu kullanılıyor (marka zaten harfin kendisi).
interface IkonProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function InstagramIkon({ size = 24, strokeWidth = 1.75, className }: IkonProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIkon({ size = 24, strokeWidth = 1.75, className }: IkonProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M14 8h-1.5c-1 0-1.5.5-1.5 1.5V11h3l-.4 3H11v6.5" />
      <path d="M11 11H9v3h2" />
    </svg>
  );
}

function YoutubeIkon({ size = 24, strokeWidth = 1.75, className }: IkonProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TiktokIkon({ size = 24, strokeWidth = 1.75, className }: IkonProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 4v9.5a3 3 0 1 1-2.5-2.96" />
      <path d="M14 4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function WhatsappIkon({ size = 24, strokeWidth = 1.75, className }: IkonProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 20l1.3-3.9A7.5 7.5 0 1 1 8.9 19z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.4.9-1l-.2-1-2-.9-.7 1a5 5 0 0 1-2.6-2.6l1-.7-.9-2-1-.2c-.6-.1-1 .3-1 .9z" />
    </svg>
  );
}

export const SOSYAL_IKONLAR: Record<SosyalPlatform, React.ComponentType<IkonProps>> = {
  INSTAGRAM: InstagramIkon,
  X: XIkon,
  FACEBOOK: FacebookIkon,
  YOUTUBE: YoutubeIkon,
  TIKTOK: TiktokIkon,
  WHATSAPP: WhatsappIkon,
};
