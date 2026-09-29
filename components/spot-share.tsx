"use client";

import { Share } from "lucide-react";
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

  // Sits on the berry slab beside the like pill, one step quieter than it
  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      className="gap-2 bg-white/12 px-5 text-white pointer-fine:hover:bg-white/20"
      onClick={() => void onShare()}
    >
      <Share aria-hidden className="size-4.5" strokeWidth={2.5} />
      {t(locale, "share")}
    </Button>
  );
}
