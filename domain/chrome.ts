import type { Locale, MessageKey } from "./messages";

export type ChromePlacement = "header" | "footer";

export type ChromeLink = {
  href: "/how-it-works" | "/nl/leaderboard";
  label: Extract<MessageKey, "howItWorks" | "leaderboard">;
  placements: readonly ChromePlacement[];
};

export const CHROME_LINKS: readonly ChromeLink[] = [
  {
    href: "/how-it-works",
    label: "howItWorks",
    placements: ["header", "footer"],
  },
  {
    href: "/nl/leaderboard",
    label: "leaderboard",
    placements: ["header", "footer"],
  },
];

export const LEGAL_LINKS = [
  { href: "/privacy", label: "privacy" },
  { href: "/privacy/data-deletion", label: "dataDeletion" },
] as const;

export function chromeLinks(placement: ChromePlacement): readonly ChromeLink[] {
  return CHROME_LINKS.filter((link) => link.placements.includes(placement));
}

export type LocaleFlag = {
  locale: Locale;
  autonym: string;
};

export const LOCALE_FLAGS: readonly LocaleFlag[] = [
  { locale: "nl", autonym: "Nederlands" },
  { locale: "en", autonym: "English" },
];
