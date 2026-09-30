import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, Camera, Heart, Images, MapPin } from "lucide-react";
import {
  likeCountLabel,
  shortDate,
  spotNoun,
  t,
  uniqueSpotsLabel,
  type Locale,
  type MessageKey,
} from "@/domain/messages";
import { Egg } from "@/components/visual";
import { StampDefs, StampFace } from "@/components/passport-stamps";
import { displayFit } from "@/lib/display-fit";
import { cn } from "@/lib/utils";

/** The four posters, in the order a spot's life runs. */
export const VERBS = [
  { id: "search", word: "hiwVerbSearch", ink: "bg-yolk", tilt: -6 },
  { id: "brag", word: "hiwVerbBrag", ink: "bg-candy", tilt: 4 },
  { id: "like", word: "hiwVerbLike", ink: "bg-mint", tilt: -3 },
  { id: "climb", word: "hiwVerbClimb", ink: "bg-milk", tilt: 6 },
] as const satisfies readonly { id: string; word: MessageKey; ink: string; tilt: number }[];

const VERB_TRACKING = 0.012;

/** Every poster sets its verb at the size that fits the widest one. */
export function verbFit(locale: Locale): number {
  return Math.max(...VERBS.map((verb) => displayFit(t(locale, verb.word), VERB_TRACKING).line));
}

const GROUND = {
  berry: "bg-berry text-white",
  milk: "bg-milk text-berry",
  white: "bg-white text-berry",
} as const;

/**
 * One verb set edge to edge across its poster, with the working piece of
 * the page where that verb happens pressed onto it.
 */
export function VerbPoster({
  id,
  word,
  fit,
  ground,
  floor,
  backdrop,
  children,
}: {
  id: string;
  word: string;
  fit: number;
  ground: keyof typeof GROUND;
  /** The poster's piece stands on its bottom edge, as the podium does. */
  floor?: boolean;
  backdrop?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      // A jump lands flush: the poster's own top padding clears the header
      className={cn("relative isolate -scroll-mt-20 overflow-hidden", GROUND[ground])}
    >
      {backdrop}
      <div
        className={cn(
          "@container relative mx-auto max-w-6xl px-5 pt-16 sm:px-8 sm:pt-24",
          floor ? "pb-0" : "pb-20 sm:pb-28",
        )}
      >
        <h2
          id={`${id}-title`}
          className={cn(
            "verb-word font-display",
            ground === "berry" ? "text-white" : "text-berry",
          )}
          style={{ "--fit": fit } as CSSProperties}
        >
          {word}
        </h2>
        <div className="relative mt-8 sm:mt-10">{children}</div>
      </div>
    </section>
  );
}

/** The hero's jump list: the four verbs as stickers pressed onto the slab. */
export function VerbStickers({ locale }: { locale: Locale }) {
  return (
    <nav aria-label={t(locale, "hiwSteps")}>
      <ol className="flex flex-wrap gap-x-3 gap-y-4 lg:flex-col lg:items-start lg:gap-5">
        {VERBS.map((verb, i) => (
          <li key={verb.id} className={cn(i % 2 === 1 && "lg:ml-16")}>
            <a
              href={`#${verb.id}`}
              style={{ "--tilt": `${verb.tilt}deg` } as CSSProperties}
              className={cn(
                "hiw-sticker sticker inline-flex items-center gap-3 rounded-full py-2 pr-4 pl-5 font-display text-2xl tracking-wide text-berry sm:text-3xl lg:py-3 lg:pr-5 lg:pl-7 lg:text-5xl",
                verb.ink,
              )}
            >
              {t(locale, verb.word)}
              <span className="flex size-7 items-center justify-center rounded-full bg-white/70 lg:size-10">
                <ArrowDown aria-hidden className="size-4 lg:size-5" strokeWidth={3} />
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** An example of a first photo, captioned the way a spot's print is. */
export function DemoPrint({ locale }: { locale: Locale }) {
  return (
    <figure
      className="brag-print hiw-print mx-auto w-full max-w-md lg:max-w-none"
      style={{ "--tilt": "-3deg" } as CSSProperties}
    >
      <div className="brag-print__photo">
        <img src="/how-it-works/pancakes.webp" alt="" decoding="async" loading="lazy" />
      </div>
      <figcaption className="flex items-end justify-between gap-4 px-3 pt-3 pb-3.5 sm:px-3.5">
        <span className="min-w-0">
          <span className="block text-xs font-bold text-berry/70">{t(locale, "discoveredBy")}</span>
          <span className="block truncate font-display text-xl leading-tight tracking-wide text-berry sm:text-2xl">
            <span className="text-blush">@</span>
            {t(locale, "hiwDemoHandle")}
          </span>
        </span>
        <span className="shrink-0 pb-1 text-xs font-bold text-berry/70">
          {t(locale, "hiwToday")}
        </span>
      </figcaption>
      <DemoMark locale={locale} className="absolute -top-3 -right-2 rotate-6" />
    </figure>
  );
}

export function BragFacts({ locale }: { locale: Locale }) {
  const facts = [
    { icon: Camera, key: "hiwBragFactPhoto" },
    { icon: MapPin, key: "hiwBragFactTown" },
    { icon: Images, key: "hiwBragFactGallery" },
  ] as const;
  return (
    <ul className="mt-8 grid gap-4">
      {facts.map(({ icon: Icon, key }) => (
        <li key={key} className="flex items-center gap-4 text-base font-semibold text-milk">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/12">
            <Icon aria-hidden className="size-5 text-yolk" strokeWidth={2.25} />
          </span>
          {t(locale, key)}
        </li>
      ))}
    </ul>
  );
}

// Second stands left of first, third right; first rises last
const STEPS = [
  { place: 1, column: "col-start-2", height: "h-32 sm:h-48 lg:h-56", ink: "bg-yolk", rise: 420, handle: null, likes: 48, spots: 6 },
  { place: 2, column: "col-start-1", height: "h-20 sm:h-32 lg:h-40", ink: "bg-candy", rise: 270, handle: "ochtendmens", likes: 31, spots: 4 },
  { place: 3, column: "col-start-3", height: "h-14 sm:h-24 lg:h-28", ink: "bg-mint", rise: 120, handle: "croissantje", likes: 22, spots: 3 },
] as const;

/** The stamp a passport gets for a woonplaats, pressed after the podium stands. */
// The example stamp's first brag, fixed so the page renders the same every time
const STAMP_DATE = Date.UTC(2026, 8, 12);

export function DemoStamp({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <div
      className={cn("stamp hiw-stamp text-candy", className)}
      style={{ "--tilt": "-11deg" } as CSSProperties}
      role="img"
      aria-label={`Giethoorn, ${uniqueSpotsLabel(locale, 3)}`}
    >
      <StampDefs />
      <StampFace top="GIETHOORN" count="3" noun={spotNoun(locale, 3)} bottom={shortDate(locale, STAMP_DATE)} />
    </div>
  );
}

/** An example leaderboard podium with you on top. */
export function DemoPodium({ locale }: { locale: Locale }) {
  const handles = STEPS.map((step) => step.handle ?? t(locale, "hiwDemoHandle"));
  return (
    <div className="relative pt-6">
      <ol aria-label={t(locale, "hiwDemo")} className="grid grid-cols-3 items-end gap-2 sm:gap-3">
        {STEPS.map((step, i) => {
          const handle = handles[i];
          return (
            <li key={step.place} className={cn("@container row-start-1 min-w-0", step.column)}>
              <div
                className="hiw-rise flex flex-col items-center"
                style={{ "--rise": `${step.rise}ms` } as CSSProperties}
              >
                <div className="flex w-full min-w-0 flex-col items-center px-1 pb-3 text-center sm:pb-4">
                  {step.place === 1 ? (
                    <Egg size={60} className="hiw-egg mb-1.5 size-11 -rotate-8 drop-shadow-sticker sm:size-15" />
                  ) : null}
                  {/* One size on every step; a long name truncates rather than shrinking */}
                  <p className="block max-w-full truncate font-display text-[0.9375rem] leading-tight tracking-wide text-white sm:text-xl lg:text-2xl">
                    <span className="text-blush">@</span>
                    {handle}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-milk tabular-nums sm:text-sm">
                    <Heart aria-hidden className="size-3.5 fill-candy text-candy" strokeWidth={2.5} />
                    {likeCountLabel(locale, step.likes)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-milk/70 tabular-nums">
                    {uniqueSpotsLabel(locale, step.spots)}
                  </p>
                </div>
                <div
                  className={cn(
                    "relative flex w-full flex-col items-center justify-between rounded-t-slab pt-2 pb-3 shadow-[inset_0_3px_0_rgb(255_255_255/0.45)] sm:pt-4 sm:pb-4",
                    step.height,
                    step.ink,
                  )}
                >
                  <span aria-hidden className="font-display text-5xl leading-none text-berry tabular-nums sm:text-7xl">
                    {step.place}
                  </span>
                  {step.place === 1 ? (
                    <DemoMark locale={locale} className="-rotate-4 px-2.5 text-xs sm:px-3 sm:text-sm" />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function LeaderboardLink({ locale }: { locale: Locale }) {
  return (
    <Link
      href="/nl/leaderboard"
      className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-base font-bold text-berry transition-[color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:text-blush"
    >
      {t(locale, "hiwSeeLeaderboard")}
    </Link>
  );
}

const RULES = [
  ["hiwRuleSpotTitle", "hiwRuleSpotBody"],
  ["hiwRuleRankTitle", "hiwRuleRankBody"],
  ["hiwRuleBrowseTitle", "hiwRuleBrowseBody"],
  ["hiwRulePhotoTitle", "hiwRulePhotoBody"],
  ["hiwRuleClosedTitle", "hiwRuleClosedBody"],
] as const satisfies readonly (readonly [MessageKey, MessageKey])[];

export function HouseRules({ locale }: { locale: Locale }) {
  return (
    <section aria-labelledby="rules-title" className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Egg size={76} className="-rotate-8 drop-shadow-sticker" />
            <h2
              id="rules-title"
              className="mt-5 font-display text-4xl leading-none tracking-wide sm:text-5xl"
            >
              {t(locale, "hiwRulesTitle")}
            </h2>
          </div>
        </div>
        <dl className="divide-y divide-berry/12 border-y border-berry/12 lg:col-span-8">
          {RULES.map(([title, body]) => (
            <div key={title} className="grid gap-2 py-6 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-8 sm:py-7">
              <dt className="font-display text-2xl leading-tight tracking-wide text-balance">
                {t(locale, title)}
              </dt>
              <dd className="max-w-prose text-base leading-7 text-pretty text-berry/75 sm:pt-0.5">
                {t(locale, body)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function DemoMark({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span
      className={cn(
        "sticker z-10 rounded-full bg-candy px-3 py-1 text-sm font-extrabold text-berry",
        className,
      )}
    >
      {t(locale, "hiwDemo")}
    </span>
  );
}
