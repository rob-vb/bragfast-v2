import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { handleCallback, handleDataDeletion } from "./instagram";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/instagram/callback",
  method: "GET",
  handler: handleCallback,
});

http.route({
  path: "/instagram/data-deletion",
  method: "POST",
  handler: handleDataDeletion,
});

http.route({
  path: "/instagram/data-deletion",
  method: "GET",
  handler: handleDataDeletion,
});

export default http;
