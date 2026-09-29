import { loadLlmsTxt } from "@/lib/catalog";

export async function GET(): Promise<Response> {
  return new Response(await loadLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
