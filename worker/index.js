/* worker/index.js — the site's ONE dynamic route.
 *
 * Everything except POST /api/feedback falls straight through to the
 * static Hugo build via the ASSETS binding — this file does not touch
 * page serving. The single job it does: take a review-page comment and
 * turn it into a GitHub issue on the submitter's behalf, so a
 * non-technical colleague can leave feedback on a pending candidate
 * without a GitHub account, a backend, or a database. Ben, 2026-08-12.
 *
 * Requires two things set on the Worker (not in this repo — secrets and
 * vars are configured via `wrangler secret put` / the dashboard):
 *   GITHUB_TOKEN   fine-grained PAT, Issues:write only, scoped to the
 *                  ONE repo in GITHUB_REPO below. Do not reuse a
 *                  broader-scoped token here.
 *   GITHUB_REPO    "owner/repo" to open issues in, e.g.
 *                  "benthepsychologist/therapybulletin-data".
 *
 * Antispam: intentionally has none beyond basic input limits — the
 * /review/ page sits behind Cloudflare Access (see deploy notes), which
 * is the actual gate. If Access is ever removed, add rate limiting here
 * first.
 */

const MAX_NAME = 200;
const MAX_COMMENT = 4000;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}

async function handleFeedback(request, env) {
  if (request.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ error: "invalid JSON" }, 400);
  }

  const candidateId = String(payload.candidate_id || "").slice(0, 200);
  const name = String(payload.name || "").trim().slice(0, MAX_NAME);
  const comment = String(payload.comment || "").trim().slice(0, MAX_COMMENT);

  if (!candidateId || !name || !comment) {
    return json({ error: "candidate_id, name, and comment are required" }, 400);
  }

  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    // Fails loudly rather than silently swallowing feedback — a
    // misconfigured Worker should be obvious, not a quiet data loss.
    return json({ error: "feedback intake not configured" }, 500);
  }

  const reviewUrl = new URL(`/review/#review-${candidateId}`, request.url).toString();
  const title = `Review feedback: ${candidateId}`;
  const body = [
    `**From:** ${name}`,
    `**On:** [${candidateId}](${reviewUrl})`,
    "",
    comment,
  ].join("\n");

  const ghRes = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "therapybulletin-review-worker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body,
      labels: ["review-feedback"],
    }),
  });

  if (!ghRes.ok) {
    const detail = await ghRes.text().catch(() => "");
    return json({ error: "could not record feedback", detail: detail.slice(0, 500) }, 502);
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/feedback") {
      return handleFeedback(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
