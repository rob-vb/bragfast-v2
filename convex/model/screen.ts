import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import {
  PHOTO_SCREEN_INSTRUCTION,
  PHOTO_SCREEN_MODEL,
  PHOTO_SCREEN_SCHEMA,
  readPhotoScreen,
  type PhotoScreenResult,
} from "../../domain/screen";

/**
 * Gemini on Google Cloud's Agent Platform (formerly Vertex AI) in the EU
 * multi-region, as Docuhelper does it. No client timeout: at busy times an
 * answer takes over a minute, and a short deadline only turns it into a 504.
 * GOOGLE_VERTEX_CREDENTIALS holds a service account's JSON key; its project
 * is the one billed. With LITELLM_URL set, the LiteLLM gateway holds the
 * credentials instead and LITELLM_API_KEY is this app's virtual key.
 * Node runtime only.
 */
function vertex(): GoogleGenAI | null {
  if (process.env.LITELLM_URL && process.env.LITELLM_API_KEY) {
    return new GoogleGenAI({
      apiKey: process.env.LITELLM_API_KEY,
      httpOptions: { baseUrl: process.env.LITELLM_URL },
    });
  }
  const raw = process.env.GOOGLE_VERTEX_CREDENTIALS;
  if (!raw) {
    return null;
  }
  const credentials = JSON.parse(raw);
  return new GoogleGenAI({
    vertexai: true,
    project: credentials.project_id,
    location: process.env.VERTEX_REGION ?? "eu",
    googleAuthOptions: {
      credentials,
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    },
  });
}

/** Ask Gemini whether a photo keeps to the house rules. Never throws. */
export async function screenPhoto(
  ctx: ActionCtx,
  storageId: Id<"_storage">,
): Promise<PhotoScreenResult> {
  try {
    const ai = vertex();
    if (!ai) {
      return { status: "unscreened", why: "no GOOGLE_VERTEX_CREDENTIALS" };
    }
    const blob = await ctx.storage.get(storageId);
    if (!blob) {
      return { status: "unscreened", why: "photo missing" };
    }
    const data = Buffer.from(await blob.arrayBuffer()).toString("base64");
    const response = await ai.models.generateContent({
      model: PHOTO_SCREEN_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: blob.type || "image/jpeg", data } },
            { text: "Check this photo." },
          ],
        },
      ],
      config: {
        systemInstruction: PHOTO_SCREEN_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseJsonSchema: PHOTO_SCREEN_SCHEMA,
      },
    });
    return readPhotoScreen({
      blockReason: response.promptFeedback?.blockReason,
      finishReason: response.candidates?.[0]?.finishReason,
      text: response.text,
    });
  } catch (error) {
    return { status: "unscreened", why: String(error).slice(0, 300) };
  }
}
