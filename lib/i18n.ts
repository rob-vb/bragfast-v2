import { cookies, headers } from "next/headers";
import type { Locale } from "@/domain/messages";

function localeFromAcceptLanguage(value: string | null): Locale {
  if (!value) {
    return "nl";
  }

  const preferred = value
    .split(",")
    .map((entry) => {
      const [tag, quality = "q=1"] = entry.trim().split(";");
      return {
        tag: tag.toLowerCase(),
        quality: Number.parseFloat(quality.replace("q=", "")),
      };
    })
    .filter(({ tag }) => tag === "nl" || tag.startsWith("nl-") || tag === "en" || tag.startsWith("en-"))
    .sort((a, b) => b.quality - a.quality)[0]?.tag;

  return preferred?.startsWith("en") ? "en" : "nl";
}

export async function getLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get("lang")?.value;
  if (cookieLocale === "nl" || cookieLocale === "en") {
    return cookieLocale;
  }

  return localeFromAcceptLanguage((await headers()).get("accept-language"));
}
