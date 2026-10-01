export type BragLiveMail = {
  subject: string;
  html: string;
};

export function bragLiveEmail(input: {
  spotName: string;
  url: string;
}): BragLiveMail | null {
  const url = input.url.trim();
  const name = input.spotName.trim();
  if (url.length === 0 || name.length === 0) {
    return null;
  }
  return {
    subject: "Je brag is live op brag.fast",
    html: `<p>Je brag bij <strong>${escapeHtml(name)}</strong> staat live.</p><p><a href="${escapeAttr(url)}">Bekijk de plek</a></p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

const ALERT_REASON: Record<string, string> = {
  offensive: "aanstootgevend of illegaal",
  spam: "spam of reclame",
  "wrong-spot": "verkeerde plek",
};

/** To the owner: a photo was reported (and hidden) or its maker blocked. */
export function moderationAlertEmail(input: {
  kind: "report" | "block";
  reason?: string;
  spotName: string;
  spotUrl: string;
  adminUrl: string;
  uploaderSlug: string | null;
}): BragLiveMail {
  const who = input.uploaderSlug ? `@${input.uploaderSlug}` : "een gebruiker zonder profiel";
  const spot = `<a href="${escapeAttr(input.spotUrl)}">${escapeHtml(input.spotName)}</a>`;
  const body =
    input.kind === "report"
      ? `<p>Een foto van ${escapeHtml(who)} bij ${spot} is gemeld als <strong>${escapeHtml(
          ALERT_REASON[input.reason ?? ""] ?? input.reason ?? "onbekend",
        )}</strong>. De foto is verborgen tot je hem beoordeelt.</p>`
      : `<p>Iemand heeft ${escapeHtml(who)} geblokkeerd vanaf een foto bij ${spot}. Kijk of die foto's binnen de regels blijven.</p>`;
  return {
    subject:
      input.kind === "report"
        ? `Melding: foto bij ${input.spotName}`
        : `Geblokkeerd: ${who}`,
    html: `${body}<p><a href="${escapeAttr(input.adminUrl)}">Open beheer</a> · we beloven binnen 24 uur te kijken.</p>`,
  };
}
