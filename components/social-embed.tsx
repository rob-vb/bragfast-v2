import { officialEmbedSrc } from "@/domain/social";
import { t, type Locale } from "@/domain/messages";
import type { SocialEmbed as SocialEmbedData } from "@/domain/post";

export function SocialEmbed({
  locale,
  embed,
}: {
  locale: Locale;
  embed: SocialEmbedData;
}) {
  const src = officialEmbedSrc(embed);
  const label =
    embed.platform === "youtube"
      ? t(locale, "youtubeEmbed")
      : t(locale, "instagramEmbed");
  const viewLabel =
    embed.platform === "youtube"
      ? t(locale, "viewOnYoutube")
      : t(locale, "viewOnInstagram");
  return (
    <div className="px-5 py-4">
      <p className="font-display text-lg tracking-wide">{label}</p>
      {src ? (
        <iframe
          src={src}
          title={label}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
          className={
            embed.platform === "youtube"
              ? "mt-3 aspect-video w-full rounded-field border-0 bg-shell"
              : "mt-3 h-[42rem] w-full rounded-field border-0 bg-shell"
          }
        />
      ) : null}
      <a
        href={embed.permalink}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block font-bold text-blush"
      >
        {viewLabel}
      </a>
      <p className="mt-2 font-display text-lg text-blush">#bragfast</p>
    </div>
  );
}
