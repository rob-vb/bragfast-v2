const CITY_SCENES: Record<string, string> = {
  haarlem: "/scenes/haarlem.png",
  amsterdam: "/scenes/amsterdam.png",
  rotterdam: "/scenes/rotterdam.png",
  utrecht: "/scenes/utrecht.png",
  "den-haag": "/scenes/den-haag.png",
  eindhoven: "/scenes/eindhoven.png",
  groningen: "/scenes/groningen.png",
};

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
  return STILLS[n];
}

export function cityScene(slug: string): string {
  return CITY_SCENES[slug] ?? stillFor(slug);
}
