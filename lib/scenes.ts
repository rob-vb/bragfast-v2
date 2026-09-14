const STILLS = [
  "/stills/pancakes.png",
  "/stills/coffee.png",
  "/stills/toast.png",
  "/stills/berries.png",
];

export const HERO_SCENE = "/scenes/hero.png";

export function stillFor(slug: string): string {
  let n = 0;
  for (let i = 0; i < slug.length; i += 1) {
    n = (n + slug.charCodeAt(i) * 17) % STILLS.length;
  }
  return STILLS[n] ?? STILLS[0]!;
}
