import type { GenericId } from "convex/values";
import { DomainParseError } from "./ids";

export type MakerKey =
  | { kind: "user"; userId: GenericId<"users"> }
  | { kind: "ig"; igUserId: string };

export type UserMakerKey = Extract<MakerKey, { kind: "user" }>;
export type MakerKeyString = string & { readonly __brand: "MakerKeyString" };

export function serializeMakerKey(key: MakerKey): MakerKeyString {
  return `${key.kind}:${key.kind === "user" ? key.userId : key.igUserId}` as MakerKeyString;
}

export function parseMakerKey(raw: string): MakerKey {
  const separator = raw.indexOf(":");
  const kind = raw.slice(0, separator);
  const value = raw.slice(separator + 1);

  if (!value || (kind !== "user" && kind !== "ig")) {
    throw new DomainParseError("MakerKey", raw);
  }

  return kind === "user"
    ? { kind, userId: value as GenericId<"users"> }
    : { kind, igUserId: value };
}
