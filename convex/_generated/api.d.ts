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
import type * as mail from "../mail.js";
import type * as model_owner from "../model/owner.js";
import type * as model_placeAdd from "../model/placeAdd.js";
import type * as model_spots from "../model/spots.js";
import type * as model_users from "../model/users.js";
import type * as notify from "../notify.js";
import type * as places from "../places.js";
import type * as seed from "../seed.js";
import type * as wipe from "../wipe.js";

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
  mail: typeof mail;
  "model/owner": typeof model_owner;
  "model/placeAdd": typeof model_placeAdd;
  "model/spots": typeof model_spots;
  "model/users": typeof model_users;
  notify: typeof notify;
  places: typeof places;
  seed: typeof seed;
  wipe: typeof wipe;
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
