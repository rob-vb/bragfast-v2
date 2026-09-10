/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as brags from "../brags.js";
import type * as catalog from "../catalog.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as ingest from "../ingest.js";
import type * as instagram from "../instagram.js";
import type * as mail from "../mail.js";
import type * as model_hygiene from "../model/hygiene.js";
import type * as model_instagram from "../model/instagram.js";
import type * as model_owner from "../model/owner.js";
import type * as model_placeAdd from "../model/placeAdd.js";
import type * as model_social from "../model/social.js";
import type * as model_spots from "../model/spots.js";
import type * as model_users from "../model/users.js";
import type * as model_votes from "../model/votes.js";
import type * as notify from "../notify.js";
import type * as osmHours from "../osmHours.js";
import type * as places from "../places.js";
import type * as seed from "../seed.js";
import type * as social from "../social.js";
import type * as standing from "../standing.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  brags: typeof brags;
  catalog: typeof catalog;
  crons: typeof crons;
  http: typeof http;
  identity: typeof identity;
  ingest: typeof ingest;
  instagram: typeof instagram;
  mail: typeof mail;
  "model/hygiene": typeof model_hygiene;
  "model/instagram": typeof model_instagram;
  "model/owner": typeof model_owner;
  "model/placeAdd": typeof model_placeAdd;
  "model/social": typeof model_social;
  "model/spots": typeof model_spots;
  "model/users": typeof model_users;
  "model/votes": typeof model_votes;
  notify: typeof notify;
  osmHours: typeof osmHours;
  places: typeof places;
  seed: typeof seed;
  social: typeof social;
  standing: typeof standing;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
