export const SIGN_IN_EVENT = "bragfast:open-signin" as const;

export function requestSignIn(): void {
  window.dispatchEvent(new Event(SIGN_IN_EVENT));
}
