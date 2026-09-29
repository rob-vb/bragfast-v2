// Bagel Fat One advance widths per 1000 units, measured in Chrome from the
// shipped woff2. The face has no kerning table, so a sum is the real width.
const ADVANCE: Record<string, number> = {
  a: 551, b: 569, c: 518, d: 581, e: 526, f: 440, g: 554, h: 547, i: 245,
  j: 255, k: 596, l: 236, m: 804, n: 547, o: 558, p: 586, q: 569, r: 482,
  s: 540, t: 519, u: 548, v: 537, w: 819, x: 558, y: 554, z: 526,
  A: 709, B: 644, C: 662, D: 661, E: 614, F: 593, G: 707, H: 672, I: 275,
  J: 582, K: 645, L: 595, M: 830, N: 686, O: 706, P: 629, Q: 709, R: 643,
  S: 644, T: 675, U: 664, V: 703, W: 930, X: 679, Y: 700, Z: 617,
  " ": 180, "'": 270, "’": 275, "-": 522, ".": 297, "(": 441, ")": 437,
};

const FALLBACK = 600;

function emWidth(text: string, tracking: number): number {
  let units = 0;
  for (const char of text.normalize("NFD").replace(/\p{M}/gu, "")) {
    units += ADVANCE[char] ?? FALLBACK;
  }
  return units / 1000 + [...text].length * tracking;
}

/** Split a display name into the chunks a line may break between. */
export function displayWords(text: string): string[] {
  return text.split(/(?<=-)|\s+/).filter(Boolean);
}

/**
 * How many ems wide a name is set in Bagel Fat One: on one line, at its
 * widest unbreakable word, and at the wider half of its most even two-line
 * break. CSS divides the container width by these to fit the name edge to
 * edge without measuring in the browser.
 */
export function displayFit(
  text: string,
  tracking: number,
): { line: number; word: number; pair: number } {
  const words = displayWords(text);
  const join = (chunk: string[]) =>
    chunk.reduce(
      (line, word, i) => line + (i === 0 || chunk[i - 1].endsWith("-") ? "" : " ") + word,
      "",
    );
  let pair = emWidth(text, tracking);
  for (let i = 1; i < words.length; i += 1) {
    pair = Math.min(
      pair,
      Math.max(
        emWidth(join(words.slice(0, i)), tracking),
        emWidth(join(words.slice(i)), tracking),
      ),
    );
  }
  return {
    line: emWidth(text, tracking),
    word: Math.max(...words.map((word) => emWidth(word, tracking))),
    pair,
  };
}
