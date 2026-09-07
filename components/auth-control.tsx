"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Preloaded } from "convex/react";
import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import { useMutation, useQuery, useAction } from "convex/react";
import { Mail, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import type { Locale, MessageKey } from "@/domain/messages";
import { t } from "@/domain/messages";

export function AuthControl({
  locale,
  preloadedUser,
  passportSlug,
}: {
  locale: Locale;
  preloadedUser: Preloaded<typeof api.auth.getCurrentUser>;
  passportSlug: string | null;
}) {
  const user = usePreloadedAuthQuery(preloadedUser);
  const instagram = useQuery(api.instagram.status);
  const startConnect = useAction(api.instagram.startConnect);
  const disconnectIg = useMutation(api.instagram.disconnect);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<MessageKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [igNotice, setIgNotice] = useState(false);

  useEffect(() => {
    function openDialog() {
      setOpen(true);
    }
    window.addEventListener("bragfast:open-signin", openDialog);
    return () => window.removeEventListener("bragfast:open-signin", openDialog);
  }, []);

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await authClient.signIn.magicLink({
      email,
      callbackURL: "/",
    });

    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Unable to send a sign-in link.");
      return;
    }
    setStatus("magicLinkSent");
  }

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (result?.error) {
      setError(result.error.message ?? t(locale, "googleUnavailable"));
      setPending(false);
    }
  }

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {passportSlug ? (
          <Link
            href={`/nl/u/${passportSlug}`}
            className="text-sm font-bold text-blush"
          >
            {t(locale, "viewPassport")}
          </Link>
        ) : null}
        {instagram?.linked ? (
          <button
            type="button"
            className="text-sm font-bold text-blush"
            onClick={() => {
              void disconnectIg().then(() => router.refresh());
            }}
          >
            {t(locale, "disconnectInstagram")}
          </button>
        ) : (
          <button
            type="button"
            className="text-sm font-bold text-blush"
            onClick={() => {
              if (!instagram?.configured) {
                setIgNotice(true);
                return;
              }
              void startConnect()
                .then((result) => {
                  window.location.href = result.url;
                })
                .catch(() => setIgNotice(true));
            }}
          >
            {t(locale, "connectInstagram")}
          </button>
        )}
        {igNotice ? (
          <span role="alert" className="text-sm text-berry/75">
            {t(locale, "instagramUnavailable")}
          </span>
        ) : null}
        <span className="hidden max-w-40 truncate text-sm text-berry sm:inline">
          {user.name ?? user.email}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={signOut}>
          {t(locale, "signOut")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        {t(locale, "signIn")}
      </Button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 overflow-y-auto bg-berry/45 backdrop-blur-sm">
              <div
                className="flex min-h-full items-end justify-center p-3 sm:items-center"
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setOpen(false);
                }}
              >
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="sign-in-title"
                  className="w-full max-w-md overflow-hidden rounded-slab bg-white shadow-2xl"
                >
            <img src="/stills/pancakes.png" alt="" className="h-28 w-full object-cover" />
            <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 id="sign-in-title" className="font-display text-3xl tracking-wide">
                  {t(locale, "signInTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-berry/70">
                  {t(locale, "signInIntro")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t(locale, "close")}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>

            <form className="mt-7" onSubmit={requestMagicLink}>
              <label className="text-sm font-bold" htmlFor="email">
                {t(locale, "emailLabel")}
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-field border border-berry/15 bg-shell px-4 focus-within:ring-2 focus-within:ring-blush">
                <Mail className="size-4 shrink-0 text-blush" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  placeholder={t(locale, "emailPlaceholder")}
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-berry/45"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button className="mt-3 w-full" type="submit" disabled={pending}>
                {t(locale, "sendMagicLink")}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-berry/45">
              <span className="h-px flex-1 bg-berry/15" />
              <span>{t(locale, "or")}</span>
              <span className="h-px flex-1 bg-berry/15" />
            </div>

            <Button
              className="w-full"
              type="button"
              variant="outline"
              disabled={pending}
              onClick={signInWithGoogle}
            >
              <span className="font-black text-blush">G</span>
              {t(locale, "continueGoogle")}
            </Button>

            {status ? (
              <p className="mt-5 rounded-field bg-shell p-4 text-sm leading-6">
                {t(locale, status)}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="mt-5 text-sm font-bold text-blush">
                {error}
              </p>
            ) : null}
            </div>
                </section>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
