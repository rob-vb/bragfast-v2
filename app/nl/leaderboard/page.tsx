import type { Metadata } from "next";
import Link from "next/link";
import { loadLeaderboard } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { likeCountLabel, t, uniqueSpotsLabel } from "@/domain/messages";
import { Egg, PhotoFrame } from "@/components/visual";
import { HERO_SCENE } from "@/lib/scenes";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, "leaderboard")} · brag.fast` };
}

export default async function LeaderboardPage() {
  const locale = await getLocale();
  const { adders } = await loadLeaderboard();

  return (
    <main>
      <section className="relative -mt-16 min-h-[42svh] sm:-mt-[4.5rem]">
        <PhotoFrame src={HERO_SCENE} className="absolute inset-0" />
        <div className="relative mx-auto flex min-h-[42svh] max-w-6xl flex-col justify-end px-5 pb-10 pt-28 sm:px-8">
          <h1 className="text-shadow-photo font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.92] tracking-wide text-white">
            {t(locale, "leaderboard")}
          </h1>
          <p className="text-shadow-photo mt-3 text-lg text-white">
            {t(locale, "leaderboardIntro")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {adders.length === 0 ? (
          <p className="text-berry/70">{t(locale, "leaderboardEmpty")}</p>
        ) : (
          <ol className="grid gap-3">
            {adders.map((adder, index) => (
              <li key={adder.username}>
                <Link
                  href={`/nl/u/${adder.username}`}
                  className="flex items-center gap-4 rounded-slab bg-milk px-4 py-3 text-berry focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yolk font-display text-xl tracking-wide">
                    {index + 1}
                  </span>
                  <Egg size={36} className="rotate-[8deg]" />
                  <span className="font-display text-2xl tracking-wide">
                    {adder.username}
                  </span>
                  <span className="ml-auto text-right text-sm font-bold">
                    <span className="block">{likeCountLabel(locale, adder.likeSum)}</span>
                    <span className="mt-0.5 block font-semibold text-berry/70">
                      {uniqueSpotsLabel(locale, adder.spotCount)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
