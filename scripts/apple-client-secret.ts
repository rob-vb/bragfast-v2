/**
 * Mint the Sign in with Apple client secret Better Auth expects.
 *
 * Apple's "client secret" is a JWT you sign yourself with the Sign in with
 * Apple key (.p8). Apple caps its lifetime at six months, so this has to be
 * re-run and re-set on Convex before it expires.
 *
 * Usage (run locally, never commit the .p8):
 *   APPLE_TEAM_ID=ABCDE12345 \
 *   APPLE_KEY_ID=XYZ9876543 \
 *   APPLE_CLIENT_ID=fast.brag.web \
 *   APPLE_PRIVATE_KEY_PATH=./AuthKey_XYZ9876543.p8 \
 *   npm run apple:client-secret
 *
 * APPLE_CLIENT_ID is the Services ID used by the website, not the iOS
 * bundle id. Set the same value as APPLE_CLIENT_ID on the Convex deployment.
 */
import { readFileSync } from "node:fs";
import { importPKCS8, SignJWT } from "jose";

const SIX_MONTHS_SECONDS = 15_777_000;
const LIFETIME_SECONDS = SIX_MONTHS_SECONDS - 24 * 60 * 60;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`apple-client-secret: ${name} is not set`);
    process.exit(1);
  }
  return value;
}

const teamId = required("APPLE_TEAM_ID");
const keyId = required("APPLE_KEY_ID");
const servicesId = required("APPLE_CLIENT_ID");
const keyPath = required("APPLE_PRIVATE_KEY_PATH");

async function main(): Promise<void> {
  const privateKey = await importPKCS8(readFileSync(keyPath, "utf8"), "ES256");
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + LIFETIME_SECONDS;

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .setAudience("https://appleid.apple.com")
    .setSubject(servicesId)
    .sign(privateKey);

  console.error(
    `Expires ${new Date(expiresAt * 1000).toISOString().slice(0, 10)}. Re-run before then.`,
  );
  process.stdout.write(`${token}\n`);
}

void main();
