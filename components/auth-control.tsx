"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Preloaded } from "convex/react";
import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import { Mail } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { SIGN_IN_EVENT } from "@/lib/sign-in-signal";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/toast";
import type { Locale } from "@/domain/messages";
import { t } from "@/domain/messages";

type DialogState =
  | { phase: "closed" }
  | { phase: "open"; email: string; error: string | null; pending: boolean };

const CLOSED: DialogState = { phase: "closed" };
const OPENED: DialogState = {
  phase: "open",
  email: "",
  error: null,
  pending: false,
};

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
  const router = useRouter();
  const [state, setState] = useState<DialogState>(CLOSED);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function openDialog() {
      setState((current) => (current.phase === "open" ? current : OPENED));
    }
    window.addEventListener(SIGN_IN_EVENT, openDialog);
    return () => window.removeEventListener(SIGN_IN_EVENT, openDialog);
  }, []);

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.phase !== "open") {
      return;
    }
    const email = state.email;
    setState({ phase: "open", email, pending: true, error: null });

    const result = await authClient.signIn.magicLink({
      email,
      callbackURL: "/",
    });

    if (result.error) {
      const message = result.error.message ?? "Unable to send a sign-in link.";
      setState((current) =>
        current.phase === "open"
          ? { ...current, pending: false, error: message }
          : current,
      );
      return;
    }
    setState(CLOSED);
    notify(t(locale, "magicLinkSent"));
  }

  async function signInWithGoogle() {
    setState((current) =>
      current.phase === "open"
        ? { ...current, pending: true, error: null }
        : current,
    );
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (result?.error) {
      setState((current) =>
        current.phase === "open"
          ? {
              ...current,
              pending: false,
              error: result.error.message ?? t(locale, "googleUnavailable"),
            }
          : current,
      );
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
    <Dialog
      open={state.phase === "open"}
      onOpenChange={(open) => setState(open ? OPENED : CLOSED)}
      trigger={<Button size="sm">{t(locale, "signIn")}</Button>}
      title={t(locale, "signInTitle")}
      description={t(locale, "signInIntro")}
      closeLabel={t(locale, "close")}
      initialFocus={emailRef}
    >
      <form className="mt-7" onSubmit={requestMagicLink}>
        <Label htmlFor="email">{t(locale, "emailLabel")}</Label>
        <div className="relative mt-2">
          <Mail
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-blush"
            aria-hidden
          />
          <Input
            ref={emailRef}
            id="email"
            type="email"
            required
            autoComplete="email"
            value={state.phase === "open" ? state.email : ""}
            placeholder={t(locale, "emailPlaceholder")}
            className="bg-shell pl-11"
            onChange={(event) => {
              const email = event.target.value;
              setState((current) =>
                current.phase === "open"
                  ? { ...current, email, error: null }
                  : current,
              );
            }}
          />
        </div>
        <Button
          className="mt-3 w-full"
          type="submit"
          disabled={state.phase === "open" && state.pending}
        >
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
        disabled={state.phase === "open" && state.pending}
        onClick={signInWithGoogle}
      >
        <span className="font-black text-blush">G</span>
        {t(locale, "continueGoogle")}
      </Button>

      {state.phase === "open" && state.error ? (
        <p role="alert" className="mt-5 text-sm font-bold text-blush">
          {state.error}
        </p>
      ) : null}
    </Dialog>
  );
}
