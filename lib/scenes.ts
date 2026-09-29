const STILLS = [
  "/stills/pancakes.png",
  "/stills/coffee.png",
  "/stills/toast.png",
  "/stills/berries.png",
];

/**
 * A still cut by scripts/hero-scene.mjs: landscape widths as
 * `${base}-${w}.avif|webp`, and a centred 3:4 crop for portrait screens as
 * `${portrait}.avif|webp`, so a phone downloads the part it shows.
 */
export type Scene = {
  base: string;
  widths: readonly number[];
  portrait: string;
};

export const HERO_SCENE: Scene = {
  base: "/scenes/hero",
  widths: [1080, 1600, 2048],
  portrait: "/scenes/hero-portrait-864",
};

export function stillFor(slug: string): string {
  let n = 0;
  for (let i = 0; i < slug.length; i += 1) {
    n = (n + slug.charCodeAt(i) * 17) % STILLS.length;
  }
  return STILLS[n];
}
