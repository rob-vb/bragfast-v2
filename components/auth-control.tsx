"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Preloaded } from "convex/react";
import { useMutation } from "convex/react";
import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { SIGN_IN_EVENT } from "@/lib/sign-in-signal";
import { DomainParseError, parseUserSlug } from "@/domain/ids";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale, MessageKey } from "@/domain/messages";
import { t } from "@/domain/messages";

type DialogState =
  | { phase: "closed" }
  | {
      phase: "sign-in";
      identifier: string;
      password: string;
      error: string | null;
      pending: boolean;
    }
  | {
      phase: "sign-up";
      username: string;
      email: string;
      password: string;
      error: string | null;
      pending: boolean;
    }
  | {
      phase: "needs-username";
      username: string;
      error: string | null;
      pending: boolean;
    };

const CLOSED: DialogState = { phase: "closed" };
const SIGN_IN_OPEN: DialogState = {
  phase: "sign-in",
  identifier: "",
  password: "",
  error: null,
  pending: false,
};
const SIGN_UP_OPEN: DialogState = {
  phase: "sign-up",
  username: "",
  email: "",
  password: "",
  error: null,
  pending: false,
};
const NEEDS_USERNAME: DialogState = {
  phase: "needs-username",
  username: "",
  error: null,
  pending: false,
};

type AuthUser = {
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

function readUsername(user: AuthUser | null | undefined): string | null {
  if (!user || typeof user.username !== "string") {
    return null;
  }
  const username = user.username.trim();
  return username.length === 0 ? null : username;
}

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

function errorMessage(
  locale: Locale,
  error: { message?: string | null; code?: string | null } | null | undefined,
  fallback: MessageKey,
): string {
  const code = error?.code ?? "";
  if (
    code === "INVALID_USERNAME" ||
    code === "USERNAME_TOO_SHORT" ||
    code === "USERNAME_TOO_LONG"
  ) {
    return t(locale, "invalidUsername");
  }
  if (code === "USERNAME_IS_ALREADY_TAKEN") {
    return t(locale, "usernameTaken");
  }
  if (
    code === "INVALID_USERNAME_OR_PASSWORD" ||
    code === "INVALID_EMAIL_OR_PASSWORD"
  ) {
    return t(locale, "wrongPassword");
  }
  return error?.message ?? t(locale, fallback);
}

function convexErrorMessage(locale: Locale, error: unknown): string {
  const data =
    error && typeof error === "object" && "data" in error
      ? (error as { data?: unknown }).data
      : undefined;
  if (data === "invalidUsername") {
    return t(locale, "invalidUsername");
  }
  if (data === "usernameTaken") {
    return t(locale, "usernameTaken");
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return t(locale, "invalidUsername");
}

export function AuthControl({
  locale,
  preloadedUser,
  passportSlug,
}: {
  locale: Locale;
  preloadedUser: Preloaded<typeof api.auth.getCurrentUser>;
  passportSlug: string | null;
}) {
  const user = usePreloadedAuthQuery(preloadedUser) as AuthUser | null;
  const router = useRouter();
  const mintPassport = useMutation(api.auth.mintPassport);
  const [state, setState] = useState<DialogState>(CLOSED);
  const identifierRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const username = readUsername(user);
  const needsUsername = Boolean(user) && username === null;

  useEffect(() => {
    function openDialog() {
      setState((current) => {
        if (current.phase !== "closed") {
          return current;
        }
        return needsUsername ? NEEDS_USERNAME : SIGN_IN_OPEN;
      });
    }
    window.addEventListener(SIGN_IN_EVENT, openDialog);
    return () => window.removeEventListener(SIGN_IN_EVENT, openDialog);
  }, [needsUsername]);

  useEffect(() => {
    if (!needsUsername) {
      return;
    }
    setState((current) =>
      current.phase === "needs-username" ? current : NEEDS_USERNAME,
    );
  }, [needsUsername]);

  async function finishAuthenticated() {
    try {
      await mintPassport();
    } catch (error) {
      setState((current) =>
        current.phase === "closed"
          ? current
          : { ...current, pending: false, error: convexErrorMessage(locale, error) },
      );
      return false;
    }
    setState(CLOSED);
    router.refresh();
    return true;
  }

  async function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.phase !== "sign-in") {
      return;
    }
    const { identifier, password } = state;
    setState({ ...state, pending: true, error: null });
    const result = looksLikeEmail(identifier)
      ? await authClient.signIn.email({ email: identifier, password })
      : await authClient.signIn.username({ username: identifier, password });
    if (result.error) {
      setState((current) =>
        current.phase === "sign-in"
          ? {
              ...current,
              pending: false,
              error: errorMessage(locale, result.error, "wrongPassword"),
            }
          : current,
      );
      return;
    }
    await finishAuthenticated();
  }

  async function submitSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.phase !== "sign-up") {
      return;
    }
    const { username: rawUsername, email, password } = state;
    let slug;
    try {
      slug = parseUserSlug(rawUsername.trim().toLowerCase());
    } catch (error) {
      if (error instanceof DomainParseError) {
        setState({
          ...state,
          pending: false,
          error: t(locale, "invalidUsername"),
        });
        return;
      }
      throw error;
    }
    setState({ ...state, pending: true, error: null });
    const result = await authClient.signUp.email({
      email,
      password,
      name: slug,
      username: slug,
    });
    if (result.error) {
      setState((current) =>
        current.phase === "sign-up"
          ? {
              ...current,
              pending: false,
              error: errorMessage(locale, result.error, "invalidUsername"),
            }
          : current,
      );
      return;
    }
    await finishAuthenticated();
  }

  async function submitUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.phase !== "needs-username") {
      return;
    }
    const rawUsername = state.username;
    let slug;
    try {
      slug = parseUserSlug(rawUsername.trim().toLowerCase());
    } catch (error) {
      if (error instanceof DomainParseError) {
        setState({
          ...state,
          pending: false,
          error: t(locale, "invalidUsername"),
        });
        return;
      }
      throw error;
    }
    setState({ ...state, pending: true, error: null });
    const result = await authClient.updateUser({ username: slug });
    if (result.error) {
      setState((current) =>
        current.phase === "needs-username"
          ? {
              ...current,
              pending: false,
              error: errorMessage(locale, result.error, "invalidUsername"),
            }
          : current,
      );
      return;
    }
    await finishAuthenticated();
  }

  async function signInWithGoogle() {
    setState((current) =>
      current.phase === "closed"
        ? current
        : { ...current, pending: true, error: null },
    );
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (result?.error) {
      setState((current) =>
        current.phase === "closed"
          ? current
          : {
              ...current,
              pending: false,
              error: t(locale, "googleUnavailable"),
            },
      );
    }
  }

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  if (user && username) {
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

  const open = state.phase !== "closed";
  const pending = state.phase !== "closed" && state.pending;
  const initialFocus =
    state.phase === "sign-in" ? identifierRef : usernameRef;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && needsUsername) {
          setState((current) =>
            current.phase === "needs-username" ? current : NEEDS_USERNAME,
          );
          return;
        }
        setState(nextOpen ? SIGN_IN_OPEN : CLOSED);
      }}
      trigger={<Button size="sm">{t(locale, "signIn")}</Button>}
      title={t(locale, "signInTitle")}
      description={t(locale, "signInIntro")}
      closeLabel={t(locale, "close")}
      initialFocus={initialFocus}
    >
      <Button
        className="mt-7 w-full"
        type="button"
        variant="outline"
        disabled={pending || state.phase === "needs-username"}
        onClick={signInWithGoogle}
      >
        <span className="font-black text-blush">G</span>
        {t(locale, "continueGoogle")}
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs text-berry/45">
        <span className="h-px flex-1 bg-berry/15" />
        <span>{t(locale, "or")}</span>
        <span className="h-px flex-1 bg-berry/15" />
      </div>

      {state.phase === "sign-in" ? (
        <form onSubmit={submitSignIn}>
          <Label htmlFor="username">{t(locale, "identifierLabel")}</Label>
          <Input
            ref={identifierRef}
            id="username"
            name="username"
            className="mt-2 bg-shell"
            autoComplete="username"
            value={state.identifier}
            onChange={(event) => {
              const identifier = event.target.value;
              setState((current) =>
                current.phase === "sign-in"
                  ? { ...current, identifier, error: null }
                  : current,
              );
            }}
          />
          <Label htmlFor="password" className="mt-4 block">
            {t(locale, "passwordLabel")}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-2 bg-shell"
            value={state.password}
            onChange={(event) => {
              const password = event.target.value;
              setState((current) =>
                current.phase === "sign-in"
                  ? { ...current, password, error: null }
                  : current,
              );
            }}
          />
          <Button className="mt-3 w-full" type="submit" disabled={pending}>
            {t(locale, "signIn")}
          </Button>
          <Button
            className="mt-3 w-full"
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setState(SIGN_UP_OPEN)}
          >
            {t(locale, "createAccount")}
          </Button>
        </form>
      ) : null}

      {state.phase === "sign-up" ? (
        <form onSubmit={submitSignUp}>
          <Label htmlFor="username">{t(locale, "usernameLabel")}</Label>
          <Input
            ref={usernameRef}
            id="username"
            name="username"
            required
            autoComplete="username"
            className="mt-2 bg-shell"
            placeholder={t(locale, "usernamePlaceholder")}
            value={state.username}
            onChange={(event) => {
              const nextUsername = event.target.value;
              setState((current) =>
                current.phase === "sign-up"
                  ? { ...current, username: nextUsername, error: null }
                  : current,
              );
            }}
          />
          <Label htmlFor="email" className="mt-4 block">
            {t(locale, "emailLabel")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 bg-shell"
            placeholder={t(locale, "emailPlaceholder")}
            value={state.email}
            onChange={(event) => {
              const email = event.target.value;
              setState((current) =>
                current.phase === "sign-up"
                  ? { ...current, email, error: null }
                  : current,
              );
            }}
          />
          <Label htmlFor="new-password" className="mt-4 block">
            {t(locale, "passwordLabel")}
          </Label>
          <Input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 bg-shell"
            value={state.password}
            onChange={(event) => {
              const password = event.target.value;
              setState((current) =>
                current.phase === "sign-up"
                  ? { ...current, password, error: null }
                  : current,
              );
            }}
          />
          <Button className="mt-3 w-full" type="submit" disabled={pending}>
            {t(locale, "createAccount")}
          </Button>
          <Button
            className="mt-3 w-full"
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setState(SIGN_IN_OPEN)}
          >
            {t(locale, "haveAccount")}
          </Button>
        </form>
      ) : null}

      {state.phase === "needs-username" ? (
        <form onSubmit={submitUsername}>
          <Label htmlFor="username">{t(locale, "usernameLabel")}</Label>
          <Input
            ref={usernameRef}
            id="username"
            name="username"
            required
            autoComplete="username"
            className="mt-2 bg-shell"
            placeholder={t(locale, "usernamePlaceholder")}
            value={state.username}
            onChange={(event) => {
              const nextUsername = event.target.value;
              setState((current) =>
                current.phase === "needs-username"
                  ? { ...current, username: nextUsername, error: null }
                  : current,
              );
            }}
          />
          <Button className="mt-3 w-full" type="submit" disabled={pending}>
            {t(locale, "createAccount")}
          </Button>
        </form>
      ) : null}

      {state.phase !== "closed" && state.error ? (
        <p role="alert" className="mt-5 text-sm font-bold text-blush">
          {state.error}
        </p>
      ) : null}
    </Dialog>
  );
}
