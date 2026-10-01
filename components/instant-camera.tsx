"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Camera, ChevronRight, Pause, Play, RotateCcw, SwitchCamera, X } from "lucide-react";
import { shortDate, t, type Locale } from "@/domain/messages";
import { cn } from "@/lib/utils";

/**
 * The app's own words (bragfast-app, src/domain/copy.ts), in the site's
 * language: the app speaks Dutch and English too.
 */
const APP = {
  nl: {
    whichPlace: "Waar heb je dit gegeten?",
    searchPlaceholder: "Zoek de tent",
    searchNearby: "Resultaten dichtbij jou eerst.",
    previewLoading: "Plek controleren…",
    changePlace: "Wijzig",
    publish: "Publiceren",
    live: "Foto staat live.",
    share: "Delen",
    viewOnSite: "Bekijk op brag.fast",
    anotherPhoto: "Nog een foto",
    badgeNew: "Nieuw op het board",
    badgeExisting: "Staat al op brag.fast",
    confirmNew: (town: string) => `Deze tent komt op het board in ${town}.`,
    confirmExisting: "Deze plek staat al op brag.fast. Je foto gaat naar de galerij.",
    liveNew: (spot: string) => `${spot} staat op het board.`,
    liveExisting: (spot: string) => `Je foto staat in de galerij van ${spot}.`,
  },
  en: {
    whichPlace: "Where did you eat this?",
    searchPlaceholder: "Find the spot",
    searchNearby: "Nearby spots at the top.",
    previewLoading: "Checking the spot…",
    changePlace: "Change",
    publish: "Publish",
    live: "Your photo is live.",
    share: "Share",
    viewOnSite: "View on brag.fast",
    anotherPhoto: "Another photo",
    badgeNew: "New on the board",
    badgeExisting: "Already on brag.fast",
    confirmNew: (town: string) => `This spot goes on the board in ${town}.`,
    confirmExisting: "This spot is already on brag.fast. Your photo goes to its gallery.",
    liveNew: (spot: string) => `${spot} is on the board.`,
    liveExisting: (spot: string) => `Your photo is in the gallery of ${spot}.`,
  },
} as const satisfies Record<Locale, unknown>;

type AppCopy = (typeof APP)[Locale];

/** What the confirm and live screens say for this act, as the app words it. */
function actCopy(app: AppCopy, act: Act) {
  return act.id === "brag"
    ? {
        badge: app.badgeNew,
        confirm: app.confirmNew(act.place.town),
        live: app.liveNew(act.place.name),
      }
    : {
        badge: app.badgeExisting,
        confirm: app.confirmExisting,
        live: app.liveExisting(act.place.name),
      };
}

type Hit = { name: string; address: string };

type Act = {
  id: "brag" | "plate";
  title: "appRowBragTitle" | "appRowPhotosTitle";
  body: "appActBragBody" | "appActPlateBody";
  /** The app's badge colour for this outcome; the chapter fills with it. */
  ink: "bg-yolk" | "bg-mint";
  photo: string;
  query: string;
  hits: readonly [Hit, Hit];
  place: { name: string; address: string; town: string; hero: string | null };
};

// Made up, and labelled so on the page. The first place is new, so the
// photo puts it on the board; the second is listed, so the photo joins its
// gallery.
const ACTS: readonly Act[] = [
  {
    id: "brag",
    title: "appRowBragTitle",
    body: "appActBragBody",
    ink: "bg-yolk",
    photo: "/how-it-works/pancakes.webp",
    query: "stapel",
    hits: [
      { name: "Café Stapel", address: "Grote Markt 7, Haarlem" },
      { name: "Stapels & Stroop", address: "Kruisstraat 30, Haarlem" },
    ],
    place: { name: "Café Stapel", address: "Grote Markt 7", town: "Haarlem", hero: null },
  },
  {
    id: "plate",
    title: "appRowPhotosTitle",
    body: "appActPlateBody",
    ink: "bg-mint",
    photo: "/how-it-works/toast.webp",
    query: "korst",
    hits: [
      { name: "Bakkerij Korst", address: "Molenstraat 12, Haarlem" },
      { name: "Korst & Kruim", address: "Zijlstraat 4, Haarlem" },
    ],
    place: {
      name: "Bakkerij Korst",
      address: "Molenstraat 12",
      town: "Haarlem",
      hero: "/how-it-works/berries.webp",
    },
  },
];

// The listed place's first brag, fixed so the page renders the same every time
const KORST_DATE = Date.UTC(2026, 8, 12);
/** The camera roll's last shot, in the corner of the viewfinder */
const LAST_PHOTO = "/how-it-works/coffee.webp";

/**
 * One act, in ms: what the thumb does and when the screen answers. It opens
 * on the camera, already pointed at the plate, finding focus.
 */
const CUE = {
  tapShutter: 900,
  flash: 980,
  search: 1050,
  type: 1400,
  perChar: 100,
  hits: 2150,
  tapHit: 2750,
  confirm: 3000,
  ready: 3500,
  tapPublish: 4450,
  publishing: 4620,
  live: 5150,
  end: 8200,
} as const;
/** The chapter is full when the print lands, not at the end of the dwell. */
const FILL_MS = CUE.live + 1600;
const TAP_MS = 440;
const FLASH_MS = 600;
const PUSH_MS = 420;
/** The breath between one act and the next when they play through. */
const GAP_MS = 1100;

type Screen = "camera" | "search" | "confirm" | "live";

/** How each screen arrives: under the shutter's flash, pushed like a sheet, or faded up. */
const MOVE: Record<Screen, "none" | "fade" | "push"> = {
  camera: "none",
  search: "fade",
  confirm: "push",
  live: "fade",
};

const SCREENS: readonly { id: Screen; at: number }[] = [
  { id: "camera", at: 0 },
  { id: "search", at: CUE.search },
  { id: "confirm", at: CUE.confirm },
  { id: "live", at: CUE.live },
];

type Frame = {
  screen: Screen;
  /** The screen sliding away under the new one, for its push. */
  leaving: Screen | null;
  typed: number;
  hits: boolean;
  tap: "shutter" | "hit" | "publish" | null;
  flash: boolean;
  ready: boolean;
  publishing: boolean;
  /** The print waits in the phone, comes out of it, then lies still. */
  print: "wait" | "eject" | "done";
};

function frameAt(t: number, act: Act): Frame {
  let index = 0;
  SCREENS.forEach((screen, i) => {
    if (t >= screen.at) {
      index = i;
    }
  });
  const current = SCREENS[index];
  const within = (at: number, ms: number) => t >= at && t < at + ms;
  return {
    screen: current.id,
    leaving: index > 0 && t - current.at < PUSH_MS ? SCREENS[index - 1].id : null,
    typed: Math.max(0, Math.min(act.query.length, Math.floor((t - CUE.type) / CUE.perChar) + 1)),
    hits: t >= CUE.hits,
    tap: within(CUE.tapShutter, TAP_MS)
      ? "shutter"
      : within(CUE.tapHit, TAP_MS)
        ? "hit"
        : within(CUE.tapPublish, TAP_MS)
          ? "publish"
          : null,
    flash: within(CUE.flash, FLASH_MS),
    ready: t >= CUE.ready,
    publishing: t >= CUE.publishing && t < CUE.live,
    print: t < CUE.live ? "wait" : t < CUE.end ? "eject" : "done",
  };
}

function sameFrame(a: Frame, b: Frame) {
  return (Object.keys(a) as (keyof Frame)[]).every((key) => a[key] === b[key]);
}

/**
 * still: an act finished and lying still (no script, reduced motion, or in
 * view when the page woke). armed: waiting off-screen on its first frame.
 */
type Mode = "still" | "armed" | "playing" | "paused" | "ended";

/**
 * The home app section's working half: the app in a phone, playing what one
 * photo does. A new place goes on its board with your name; a listed place
 * takes your photo into its gallery. It plays once, when half in view.
 */
export function InstantCamera({
  locale,
  heading,
  cta,
}: {
  locale: Locale;
  heading: ReactNode;
  cta: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const clock = useRef<number>(CUE.end);
  const [act, setAct] = useState(0);
  const [run, setRun] = useState(0);
  const [mode, setMode] = useState<Mode>("still");
  const [frame, setFrame] = useState<Frame>(() => frameAt(CUE.end, ACTS[0]));
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [awake, setAwake] = useState(true);

  const running = mode === "playing" && visible && awake;
  const animated = mode === "armed" || mode === "playing" || mode === "paused";

  function cue(next: number, at: number) {
    clock.current = at;
    setAct(next);
    setFrame(frameAt(at, ACTS[next]));
  }

  function play(next: number) {
    if (reduced) {
      cue(next, CUE.end);
      setMode("still");
      return;
    }
    cue(next, 0);
    setRun((r) => r + 1);
    setMode("playing");
  }

  // Off-screen at wake, the stage waits on its first frame for autoplay;
  // on screen, or with reduced motion, it stays the finished still.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      return;
    }
    clock.current = 0;
    setFrame(frameAt(0, ACTS[0]));
    setMode("armed");
  }, []);

  // Half in view starts it; scrolled away, it holds its breath.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) {
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }
        setVisible(entry.intersectionRatio >= 0.15);
        if (entry.intersectionRatio >= 0.5) {
          setMode((m) => (m === "armed" ? "playing" : m));
        }
      },
      { threshold: [0, 0.15, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setAwake(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // The clock only runs while the stage is seen; CSS motion pauses with it.
  useEffect(() => {
    if (!running) {
      return;
    }
    let last = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      clock.current += Math.min(now - last, 100);
      last = now;
      const at = clock.current;
      if (act < ACTS.length - 1 && at >= CUE.end + GAP_MS) {
        clock.current = 0;
        setAct(act + 1);
        setRun((r) => r + 1);
        setFrame(frameAt(0, ACTS[act + 1]));
        return;
      }
      if (act === ACTS.length - 1 && at >= CUE.end) {
        setFrame(frameAt(CUE.end, ACTS[act]));
        setMode("ended");
        return;
      }
      const next = frameAt(at, ACTS[act]);
      setFrame((prev) => (sameFrame(prev, next) ? prev : next));
      raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [running, act]);

  function toggle() {
    if (mode === "playing") {
      setMode("paused");
    } else if (mode === "paused" || mode === "armed") {
      setMode("playing");
    } else {
      play(0);
    }
  }

  const control =
    mode === "playing"
      ? { icon: Pause, label: t(locale, "appDemoPause") }
      : mode === "paused" || mode === "armed"
        ? { icon: Play, label: t(locale, "appDemoPlay") }
        : { icon: RotateCcw, label: t(locale, "appDemoReplay") };
  const ControlIcon = control.icon;

  return (
    <div
      className="cam grid gap-y-10 lg:grid-cols-12 lg:gap-x-12"
      data-live={animated ? "" : undefined}
      data-paused={animated && !running ? "" : undefined}
      style={{ "--fill-ms": `${FILL_MS}ms` } as CSSProperties}
    >
      {/* Phones read heading, scene, chapters, buttons; wide screens hold the
          words in one column beside the scene */}
      <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:gap-10">
        <div className="order-1">{heading}</div>
        {/* Under lg the acts are a row of stickers right above the scene, so
            the act and its progress share the screen with the phone; the
            playing act's line sits under them */}
        <div className="order-2">
          <ol className="flex flex-wrap gap-x-3 gap-y-3 lg:grid lg:gap-6">
            {ACTS.map((item, i) => {
              const status =
                i < act
                  ? "done"
                  : i > act || mode === "armed"
                    ? "idle"
                    : mode === "playing" || mode === "paused"
                      ? "playing"
                      : "done";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={i === act}
                    onClick={() => play(i)}
                    data-status={status}
                    style={{ "--tilt": i === 0 ? "-2deg" : "2deg" } as CSSProperties}
                    className="cam-chapter group grid justify-items-start gap-2.5 rounded-slab text-left lg:w-full"
                  >
                    <span className="cam-chapter__tag sticker relative inline-flex rounded-full bg-white px-3.5 py-1 font-display text-lg tracking-wide text-berry sm:px-5 sm:py-1.5 sm:text-2xl lg:text-3xl">
                      <span key={`${run}-${i}`} aria-hidden className={cn("cam-chapter__fill", item.ink)} />
                      <span className="relative">{t(locale, item.title)}</span>
                    </span>
                    <span className="hidden max-w-sm text-base leading-7 font-semibold text-pretty text-berry/75 lg:block">
                      {t(locale, item.body)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 max-w-md text-base leading-7 font-semibold text-pretty text-berry/75 lg:hidden">
            {t(locale, ACTS[act].body)}
          </p>
        </div>
        <div className="order-4">{cta}</div>
      </div>

      <div className="order-3 lg:col-span-7 lg:self-center">
        <div className="cam-stage-wrap mx-auto w-full max-w-[34rem] pb-16 lg:max-w-none">
          <div ref={stageRef} className="cam-stage">
            <div aria-hidden className="cam-scene">
              <span className="cam-plate" />
              <Board key={`board-${run}-${act}`} locale={locale} act={ACTS[act]} frame={frame} />
              <Phone
                locale={locale}
                act={ACTS[act]}
                frame={frame}
                onShutter={() => {
                  if (mode === "armed" || mode === "paused") {
                    setMode("playing");
                  }
                }}
                onAnother={() => play((act + 1) % ACTS.length)}
              />
              <Print
                key={`print-${run}-${act}`}
                className="cam-flying"
                data-phase={frame.print}
                data-to={ACTS[act].id === "brag" ? "board" : "tile"}
                photo={ACTS[act].photo}
                label={ACTS[act].id === "brag" ? t(locale, "discoveredBy") : null}
                handle={t(locale, "hiwDemoHandle")}
                when={ACTS[act].id === "brag" ? t(locale, "hiwToday") : null}
                demo={ACTS[act].id === "brag" ? t(locale, "hiwDemo") : null}
              >
                {ACTS[act].id === "brag" ? (
                  <span className="cam-sticker sticker bg-yolk">{t(locale, "appStickerNew")}</span>
                ) : null}
              </Print>
            </div>
            {reduced ? null : (
              <button
                type="button"
                onClick={toggle}
                className="cam-control flex h-10 whitespace-nowrap items-center gap-2 rounded-full bg-white pr-4 pl-3 text-sm font-bold text-berry ring-1 ring-berry/12 transition-[color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:text-blush"
              >
                <ControlIcon aria-hidden className="size-4" strokeWidth={2.75} />
                {control.label}
              </button>
            )}
          </div>
        </div>
        <p className="sr-only">{t(locale, "appDemoSummary")}</p>
      </div>
    </div>
  );
}

/** What the site shows for the act: an empty spot on the board, or a listed spot and its gallery. */
function Board({ locale, act, frame }: { locale: Locale; act: Act; frame: Frame }) {
  if (act.id === "brag") {
    return frame.ready && frame.print !== "done" ? (
      <span className="cam-slot cam-slot--board cam-surface">
        <span className="cam-slot__disc">
          <Camera className="size-[42%] text-blush" strokeWidth={2.5} />
        </span>
      </span>
    ) : null;
  }
  return (
    <>
      {frame.ready ? (
        <>
          <Print
            className="cam-korst cam-surface"
            photo={act.place.hero ?? act.photo}
            label={t(locale, "discoveredBy")}
            handle="ochtendmens"
            when={shortDate(locale, KORST_DATE)}
            demo={t(locale, "hiwDemo")}
          />
          <Print
            className="cam-tile-a cam-surface"
            style={{ "--d": "90ms" } as CSSProperties}
            photo="/how-it-works/coffee.webp"
            label={null}
            handle="croissantje"
            when={null}
          />
        </>
      ) : null}
      {frame.ready && frame.print !== "done" ? (
        <span className="cam-slot cam-slot--tile cam-surface" style={{ "--d": "160ms" } as CSSProperties}>
          <span className="cam-slot__disc">
            <Camera className="size-[42%] text-blush" strokeWidth={2.5} />
          </span>
        </span>
      ) : null}
      {frame.print !== "wait" ? (
        <span className="cam-gallery-sticker sticker bg-mint">{t(locale, "appStickerGallery")}</span>
      ) : null}
    </>
  );
}

/** A brag.fast print: the photo on a white slab, its lip captioned. */
function Print({
  className,
  style,
  photo,
  label,
  handle,
  when,
  demo,
  children,
  ...data
}: {
  className: string;
  style?: CSSProperties;
  photo: string;
  label: string | null;
  handle: string;
  when: string | null;
  /** The Voorbeeld sticker, on the prints that stand for made-up spots */
  demo?: string | null;
  children?: ReactNode;
  "data-phase"?: string;
  "data-to"?: string;
}) {
  return (
    <figure className={cn("cam-print", className)} style={style} {...data}>
      <div className="cam-print__photo">
        <img src={photo} alt="" decoding="async" loading="lazy" />
      </div>
      <figcaption className="cam-cap">
        <span className="min-w-0">
          {label ? <span className="cam-cap__label">{label}</span> : null}
          <span className="cam-cap__handle">
            <span className="text-blush">@</span>
            {handle}
          </span>
        </span>
        {when ? <span className="cam-cap__when">{when}</span> : null}
      </figcaption>
      {demo ? <span className="cam-print__demo sticker">{demo}</span> : null}
      {children}
    </figure>
  );
}

function Phone({
  locale,
  act,
  frame,
  onShutter,
  onAnother,
}: {
  locale: Locale;
  act: Act;
  frame: Frame;
  onShutter: () => void;
  onAnother: () => void;
}) {
  const state = (screen: Screen) =>
    frame.screen === screen ? "in" : frame.leaving === screen ? "out" : undefined;
  const existing = act.place.hero !== null;
  const app = APP[locale];
  const words = actCopy(app, act);
  return (
    <div className="cam-phone">
      <div
        className="cam-screen"
        data-move={MOVE[frame.screen]}
        data-dark={frame.screen === "camera" ? "" : undefined}
      >
        <StatusBar />

        <div className="cam-scr cam-camera" data-state={state("camera")}>
          <div className="cam-viewfinder">
            <img src={act.photo} alt="" decoding="async" loading="lazy" />
            <span className="cam-thirds" />
            <span className="cam-focus" />
            <span className="cam-zoom">1×</span>
          </div>
          <div className="cam-camera__row">
            <span className="cam-camera__last">
              <img src={LAST_PHOTO} alt="" decoding="async" loading="lazy" />
            </span>
            <button
              type="button"
              tabIndex={-1}
              onClick={onShutter}
              className="cam-shutter"
              data-pressed={frame.tap === "shutter" ? "" : undefined}
            >
              <span className="cam-shutter__core" />
              {frame.tap === "shutter" ? <span className="cam-touch" /> : null}
            </button>
            <span className="cam-camera__flip">
              <SwitchCamera strokeWidth={2} />
            </span>
          </div>
        </div>

        <div className="cam-scr" data-state={state("search")}>
          <div className="cam-top">
            <span className="cam-icon">
              <X strokeWidth={2.5} />
            </span>
          </div>
          <div className="cam-search-head">
            <img src={act.photo} alt="" className="cam-thumb" decoding="async" loading="lazy" />
            <p className="cam-question">{app.whichPlace}</p>
          </div>
          <div className="cam-input">
            {frame.typed > 0 ? (
              <span>{act.query.slice(0, frame.typed)}</span>
            ) : (
              <span className="cam-input__placeholder">{app.searchPlaceholder}</span>
            )}
            <span className="cam-caret" />
          </div>
          <p className="cam-hint">{app.searchNearby}</p>
          {frame.hits ? (
            <ul className="cam-hits">
              {act.hits.map((hit, i) => (
                <li key={hit.name} className="cam-hit" style={{ "--i": i } as CSSProperties}>
                  <span className="cam-mark">
                    <span className="cam-mark__dot" />
                  </span>
                  <span className="cam-hit__text">
                    <span className="cam-hit__name">{hit.name}</span>
                    <span className="cam-hit__address">{hit.address}</span>
                  </span>
                  <ChevronRight className="cam-hit__chevron" strokeWidth={2.5} />
                  {i === 0 && frame.tap === "hit" ? <span className="cam-touch" /> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="cam-scr" data-state={state("confirm")}>
          <div className="cam-top">
            <span className="cam-icon">
              <X strokeWidth={2.5} />
            </span>
          </div>
          <div className="cam-hero">
            <img src={act.photo} alt="" decoding="async" loading="lazy" />
            {frame.publishing ? (
              <span className="cam-veil">
                <span className="cam-spin" />
              </span>
            ) : null}
            {frame.ready ? (
              <span className={cn("cam-badge", existing ? "bg-mint" : "bg-yolk")}>{words.badge}</span>
            ) : null}
          </div>
          <div className="cam-place">
            <span className="cam-mark">
              {frame.ready && act.place.hero ? (
                <img src={act.place.hero} alt="" decoding="async" loading="lazy" />
              ) : (
                <span className="cam-mark__dot" />
              )}
            </span>
            <span className="cam-hit__text">
              <span className="cam-hit__name">{act.place.name}</span>
              <span className="cam-hit__address">{act.place.address}</span>
              {frame.ready ? <span className="cam-hit__address">{act.place.town}</span> : null}
            </span>
            <span className="cam-link">{app.changePlace}</span>
          </div>
          {frame.ready ? (
            <p className="cam-lede cam-lede--confirm">{words.confirm}</p>
          ) : (
            <p className="cam-lede cam-inline">
              <span className="cam-spin cam-spin--blush" />
              {app.previewLoading}
            </p>
          )}
          <div className="cam-foot">
            <span
              className="cam-btn"
              data-disabled={frame.ready ? undefined : ""}
              data-pressed={frame.tap === "publish" ? "" : undefined}
            >
              {frame.publishing ? <span className="cam-spin" /> : app.publish}
              {frame.tap === "publish" ? <span className="cam-touch" /> : null}
            </span>
          </div>
        </div>

        <div className="cam-scr" data-state={state("live")}>
          <div className="cam-top">
            <img src="/brag_fast_logo.svg" alt="" className="cam-logo" />
            <span className="cam-pill">{app.share}</span>
          </div>
          <div className="cam-hero cam-hero--live">
            <img src={act.photo} alt="" decoding="async" loading="lazy" />
          </div>
          <p className="cam-display">{app.live}</p>
          <p className="cam-lede cam-lede--live">{words.live}</p>
          <div className="cam-foot">
            <span className="cam-btn">{app.viewOnSite}</span>
            <button type="button" tabIndex={-1} onClick={onAnother} className="cam-btn cam-btn--ghost">
              {app.anotherPhoto}
            </button>
          </div>
        </div>

        {frame.flash ? <span className="cam-flash" /> : null}
      </div>
      <span className="cam-mark-demo sticker">{t(locale, "hiwDemo")}</span>
    </div>
  );
}

/** 8:15 on a Saturday: breakfast time. */
function StatusBar() {
  return (
    <div className="cam-status">
      <span>8:15</span>
      <span className="cam-island" />
      <svg viewBox="0 0 66 14" className="cam-status__icons" fill="currentColor">
        <rect x="0" y="9" width="3.5" height="5" rx="1" />
        <rect x="5.5" y="6.5" width="3.5" height="7.5" rx="1" />
        <rect x="11" y="4" width="3.5" height="10" rx="1" />
        <rect x="16.5" y="1.5" width="3.5" height="12.5" rx="1" />
        <rect x="35" y="1" width="26" height="12" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
        <rect x="37.5" y="3.5" width="17" height="7" rx="1.75" />
        <rect x="62.5" y="5" width="2" height="4" rx="1" fillOpacity="0.4" />
      </svg>
    </div>
  );
}
