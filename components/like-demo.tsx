"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Heart } from "lucide-react";
import { demoTopLabel, likeCountLabel, t, type Locale } from "@/domain/messages";
import { useSeen } from "@/components/stage";
import { cn } from "@/lib/utils";

type DemoSpot = {
  id: string;
  name: string;
  street: string;
  src: string;
  /** Likes from everyone else, and when the newest of them landed. */
  others: number;
  othersAt: number;
  addedAt: number;
};

// Made up, and labelled so on the page. Three prints a like apart, so one
// like from someone else ties the top and the newest like breaks it.
const SPOTS: readonly DemoSpot[] = [
  { id: "dooier", name: "Café Dooier", street: "Markt 7", src: "/how-it-works/toast.webp", others: 14, othersAt: 3, addedAt: 1 },
  { id: "korst", name: "Bakkerij Korst", street: "Molenstraat 12", src: "/how-it-works/berries.webp", others: 13, othersAt: 2, addedAt: 2 },
  { id: "lepel", name: "Lunchroom Lepel", street: "Kerkplein 3", src: "/how-it-works/coffee.webp", others: 9, othersAt: 1, addedAt: 3 },
];

/** Someone else likes the runner-up this long after the board comes into view. */
const NUDGE_MS = 1300;
/** The +1 floats off in 1s; it goes away on time under reduced motion too. */
const PLUS_MS = 1100;

type Row = DemoSpot & { likes: number; mine: boolean };

/** The city board's order: likes, then the newest like, then the newest add. */
function rank(spots: readonly DemoSpot[], mine: Record<string, number>): Row[] {
  return spots
    .map((spot) => {
      const mineAt = mine[spot.id];
      return {
        ...spot,
        likes: spot.others + (mineAt === undefined ? 0 : 1),
        mine: mineAt !== undefined,
        lastAt: Math.max(spot.othersAt, mineAt ?? 0),
      };
    })
    .sort((a, b) => b.likes - a.likes || b.lastAt - a.lastAt || b.addedAt - a.addedAt);
}

function glide(update: () => void) {
  if (
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

/**
 * The Like poster's working half: an example board of three prints. Tap a
 * heart and the board re-sorts the way a real one does, a tie going to the
 * newest like.
 */
export function LikeDemo({
  locale,
  children,
  rules,
}: {
  locale: Locale;
  children: ReactNode;
  rules: { one: string; undo: string; tie: string };
}) {
  const boardRef = useRef<HTMLOListElement>(null);
  const seen = useSeen(boardRef, 0.5);
  const [spots, setSpots] = useState(SPOTS);
  const [mine, setMine] = useState<Record<string, number>>({});
  const [pops, setPops] = useState<Record<string, number>>({});
  const [plus, setPlus] = useState<string | null>(null);
  const [moved, setMoved] = useState(false);
  const clock = useRef(10);

  const rows = rank(spots, mine);
  const tied = rows.length > 1 && rows[0].likes === rows[1].likes;
  // Read out who is on top once the board has moved at all
  const said = moved && rows[0] ? demoTopLabel(locale, rows[0].name) : "";

  function commit(update: () => void) {
    glide(() => {
      update();
      setMoved(true);
    });
  }

  useEffect(() => {
    if (!seen) {
      return;
    }
    let clear = 0;
    const id = window.setTimeout(() => {
      clear = window.setTimeout(() => setPlus(null), PLUS_MS);
      clock.current += 1;
      const at = clock.current;
      commit(() => {
        setSpots((list) =>
          list.map((spot) =>
            spot.id === "korst" ? { ...spot, others: spot.others + 1, othersAt: at } : spot,
          ),
        );
        setPlus("korst");
        setPops((p) => ({ ...p, korst: (p.korst ?? 0) + 1 }));
      });
    }, NUDGE_MS);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(clear);
    };
    // Once, when the board first comes into view
  }, [seen]);

  function toggle(id: string) {
    clock.current += 1;
    const at = clock.current;
    const liking = mine[id] === undefined;
    commit(() => {
      setMine((m) => {
        const next = { ...m };
        if (liking) {
          next[id] = at;
        } else {
          delete next[id];
        }
        return next;
      });
      if (liking) {
        setPops((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
      }
      setPlus(null);
    });
  }

  const ruleList = [
    { key: "one", text: rules.one, lit: false },
    { key: "undo", text: rules.undo, lit: false },
    { key: "tie", text: rules.tie, lit: tied },
  ];

  return (
    <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-x-12">
      <div className="lg:col-span-5 lg:pt-10">
        {children}
        <ul className="mt-7 flex flex-col items-start gap-2.5">
          {ruleList.map((rule) => (
            <li
              key={rule.key}
              className={cn(
                "inline-flex items-center gap-2.5 rounded-full py-2 pr-4 pl-2 text-sm font-bold transition-[background-color,color,scale] duration-300 ease-out-strong",
                rule.lit ? "scale-[1.03] bg-yolk text-berry" : "bg-milk text-berry",
              )}
            >
              <span
                aria-hidden
                className="flex size-6 items-center justify-center rounded-full bg-white"
              >
                <Heart className="size-3.5 fill-blush text-blush" strokeWidth={2.5} />
              </span>
              {rule.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-7 lg:-mt-10">
        <ol
          ref={boardRef}
          aria-label={t(locale, "hiwDemoBoard")}
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
        >
          {rows.map((row, i) => {
            const big = i === 0;
            const likePill = (
              <div className="relative shrink-0">
                {plus === row.id ? (
                  <span
                    aria-hidden
                    className="plus-one pointer-events-none absolute -top-5 right-1 rounded-full bg-candy px-2 py-0.5 text-xs font-extrabold text-berry"
                  >
                    +1
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-pressed={row.mine}
                  aria-label={`${t(locale, "like")}, ${likeCountLabel(locale, row.likes)}`}
                  onClick={() => toggle(row.id)}
                  className={cn(
                    "relative inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold tabular-nums transition-[color,background-color,border-color,transform] duration-press ease-out-strong active:scale-[0.97] after:absolute after:-inset-1.5 after:content-['']",
                    row.mine
                      ? "bg-blush text-white"
                      : "border border-berry/15 bg-white text-berry pointer-fine:hover:border-blush pointer-fine:hover:text-blush",
                  )}
                >
                  <Heart
                    key={pops[row.id] ?? 0}
                    aria-hidden
                    strokeWidth={2.5}
                    className={cn(
                      "size-4",
                      row.mine ? "fill-current" : "text-blush",
                      (pops[row.id] ?? 0) > 0 && "like-pop",
                    )}
                  />
                  {row.likes}
                </button>
              </div>
            );
            return (
              <li
                key={row.id}
                style={{ viewTransitionName: `hiw-${row.id}` } as CSSProperties}
                className={cn(big && "col-span-2 lg:row-span-2")}
              >
                <article className="relative flex h-full flex-col rounded-slab bg-milk p-2">
                  <div
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-candy/40",
                      big && "lg:aspect-auto lg:min-h-0 lg:flex-1",
                    )}
                  >
                    <img
                      src={row.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 size-full object-cover"
                    />
                    <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-berry/10 ring-inset" />
                  </div>
                  {big ? (
                    <div className="flex items-center gap-2 px-2 pt-3 pb-1.5 sm:gap-3 sm:px-3 sm:pt-4 sm:pb-2.5">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-2xl leading-[1.08] tracking-wide text-balance text-berry sm:text-3xl lg:text-4xl">
                          {row.name}
                        </h3>
                        <p className="mt-0.5 truncate text-xs font-semibold text-berry/70 sm:text-sm">
                          {row.street}
                        </p>
                      </div>
                      {likePill}
                    </div>
                  ) : (
                    <div className="px-2 pt-3 pb-1.5">
                      <h3 className="font-display text-lg leading-[1.08] tracking-wide text-balance text-berry sm:text-xl">
                        {row.name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-berry/70 sm:text-sm">
                          {row.street}
                        </p>
                        {likePill}
                      </div>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-berry/70">
          <span className="rounded-full bg-candy px-2.5 py-1 text-xs font-extrabold text-berry">
            {t(locale, "hiwDemo")}
          </span>
          {t(locale, "hiwDemoHint")}
        </p>
        <p aria-live="polite" className="sr-only">
          {said}
        </p>
      </div>
    </div>
  );
}
