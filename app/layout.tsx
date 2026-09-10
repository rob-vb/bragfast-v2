import type { Metadata } from "next";
import { Bagel_Fat_One, Nunito } from "next/font/google";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery, getToken, preloadAuthQuery } from "@/lib/auth-server";
import { getLocale } from "@/lib/i18n";
import { ConvexClientProvider } from "@/app/convex-client-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const bagel = Bagel_Fat_One({
  variable: "--font-bagel",
  subsets: ["latin"],
  weight: "400",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const DIRECTION = `
THESIS: A seeker lands inside a golden-hour breakfast still. The photo is the product. Type sits on it like a painted sleeve title. Discovery owns the product.
OWN-WORLD: Milk header, white content, berry ink, candy/blush/yolk stickers, Bagel Fat One, SVG egg lockup, rank as yolk sticker. Photos full-bleed. Cocoa brown stays on the egg only.
STORY: Feel a Saturday table, search a city, pick a numbered photo.
FIRST VIEWPORT: Full-bleed still. Header lockup. Search pill on the photo. No eyebrow.
FORM: Outdoor terrace still, seed 9bbca63c assigned 3, kawaii egg on strawberry milk. User pin.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
`;

export const metadata: Metadata = {
  title: "brag.fast",
  description: "Ontbijt- en brunchplekken, per stad.",
  icons: {
    icon: "/brag_fast_egg.svg",
    apple: "/brag_fast_egg.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, initialToken, preloadedUser, mine, isOwner] = await Promise.all([
    getLocale(),
    getToken(),
    preloadAuthQuery(api.auth.getCurrentUser),
    fetchAuthQuery(api.identity.mine),
    fetchAuthQuery(api.identity.isOwner),
  ]);

  return (
    <html lang={locale} className={`${bagel.variable} ${nunito.variable}`}>
      <body>
        <div dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION}-->` }} />
        <ConvexClientProvider initialToken={initialToken}>
          <SiteHeader
            locale={locale}
            preloadedUser={preloadedUser}
            passportSlug={mine?.slug ?? null}
            isOwner={isOwner === true}
          />
          {children}
          <SiteFooter locale={locale} />
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
