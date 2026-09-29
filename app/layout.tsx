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
        <ConvexClientProvider initialToken={initialToken}>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader
              locale={locale}
              preloadedUser={preloadedUser}
              passportSlug={mine?.slug ?? null}
              isOwner={isOwner === true}
            />
            <div className="flex flex-1 flex-col">{children}</div>
            <SiteFooter locale={locale} />
            <Toaster />
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
