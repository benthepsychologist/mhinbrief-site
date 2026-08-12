/* worker/access-jwt.js — verifies a Cloudflare Access JWT and returns the
 * authenticated person's verified email.
 *
 * Every request that reaches this Worker on a path Access protects
 * (/review/*, /api/feedback) carries a `Cf-Access-Jwt-Assertion` header —
 * a JWT Cloudflare signs itself, once, at the moment someone completes
 * their email-OTP login. This does NOT trust that header blindly: it
 * verifies the signature against Cloudflare's own public keys, checks the
 * token is for THIS Access application (the `aud` claim) and not expired,
 * before treating the `email` claim as real. Skipping verification would
 * mean trusting any caller who can set an HTTP header, which is nobody's
 * definition of "verified."
 *
 * Cloudflare's public keys are fetched from
 * https://<team>.cloudflareaccess.com/cdn-cgi/access/certs — a JWKS
 * (JSON Web Key Set), cached in module scope so a warm Worker instance
 * doesn't refetch it per-request. A cold start refetches once.
 */

let jwksCache = null;
let jwksCacheAt = 0;
const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour — keys rotate rarely

function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeJSON(str) {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(str)));
}

async function getJwks(teamDomain) {
  const now = Date.now();
  if (jwksCache && now - jwksCacheAt < JWKS_TTL_MS) return jwksCache;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`could not fetch Access certs: ${res.status}`);
  const jwks = await res.json();
  jwksCache = jwks;
  jwksCacheAt = now;
  return jwks;
}

async function importKey(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

/** Returns the verified email string, or null if the token is missing,
 * malformed, expired, wrong-audience, or fails signature verification.
 * Never throws — a bad token is a 401, not a 500. */
export async function verifyAccessJwt(request, env) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  let header, payload;
  try {
    header = base64UrlDecodeJSON(headerB64);
    payload = base64UrlDecodeJSON(payloadB64);
  } catch (e) {
    return null;
  }

  if (!payload.email || !payload.aud || !payload.exp) return null;
  if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) return null;

  let jwks;
  try {
    jwks = await getJwks(env.ACCESS_TEAM_DOMAIN);
  } catch (e) {
    return null;
  }
  const jwk = (jwks.keys || []).find((k) => k.kid === header.kid);
  if (!jwk) return null;

  let key;
  try {
    key = await importKey(jwk);
  } catch (e) {
    return null;
  }

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(sigB64);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    signedData
  );
  if (!valid) return null;

  return payload.email;
}
