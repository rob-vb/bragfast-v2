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
