/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as catalog from "../catalog.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as leaderboard from "../leaderboard.js";
import type * as likes from "../likes.js";
import type * as mail from "../mail.js";
import type * as model_account from "../model/account.js";
import type * as model_owner from "../model/owner.js";
import type * as model_photos from "../model/photos.js";
import type * as model_placeAdd from "../model/placeAdd.js";
import type * as model_screen from "../model/screen.js";
import type * as model_spots from "../model/spots.js";
import type * as model_users from "../model/users.js";
import type * as moderation from "../moderation.js";
import type * as notify from "../notify.js";
import type * as photos from "../photos.js";
import type * as places from "../places.js";
import type * as seed from "../seed.js";
import type * as wipe from "../wipe.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  admin: typeof admin;
  auth: typeof auth;
  catalog: typeof catalog;
  crons: typeof crons;
  http: typeof http;
  identity: typeof identity;
  leaderboard: typeof leaderboard;
  likes: typeof likes;
  mail: typeof mail;
  "model/account": typeof model_account;
  "model/owner": typeof model_owner;
  "model/photos": typeof model_photos;
  "model/placeAdd": typeof model_placeAdd;
  "model/screen": typeof model_screen;
  "model/spots": typeof model_spots;
  "model/users": typeof model_users;
  moderation: typeof moderation;
  notify: typeof notify;
  photos: typeof photos;
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
