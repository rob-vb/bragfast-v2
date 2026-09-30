import { getImageProps } from "next/image";

/**
 * Points an `<img>` at the server's image optimizer instead of the Convex
 * original. The server fetches each photo from Convex once per width, caches
 * the resized WebP, and serves every later view from that cache, so page
 * views stop costing Convex bandwidth. `sizes` is how wide the photo renders.
 */
export function photoSrc(src: string, sizes: string) {
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

/** A print in the 1 / 2 / 3 column grid inside the max-w-6xl page. */
export const CARD_SIZES =
  "(min-width: 72rem) 23rem, (min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw";

/** The first print on a board, spanning two columns from sm up. */
export const WIDE_CARD_SIZES =
  "(min-width: 72rem) 47rem, (min-width: 64rem) 66vw, 100vw";
