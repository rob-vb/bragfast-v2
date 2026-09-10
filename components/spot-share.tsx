"use client";

import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { t, type Locale } from "@/domain/messages";

async function copyUrl(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // HTTP preview and some browsers reject clipboard; fall through.
  }
  try {
    const input = document.createElement("input");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.top = "0";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  } catch {
    return false;
  }
}

export function SpotShare({
  locale,
  url,
  name,
}: {
  locale: Locale;
  url: string;
  name: string;
}) {
  async function onShare() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: name, url });
        return;
      }
    } catch (caught) {
      if (caught instanceof Error && caught.name === "AbortError") {
        return;
      }
    }
    const copied = await copyUrl(url);
    notify(t(locale, copied ? "linkCopied" : "shareFailed"));
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void onShare()}>
      {t(locale, "share")}
    </Button>
  );
}
