# mhinbrief-site

Hugo site for **MH in Brief** (mhinbrief.com) — the verified
reference for the rules governing behavioural-health practice in Canada.
Name locked 2026-07-31, renamed from Therapy Bulletin 2026-08-12.

**This repo is public** (Ben, 2026-08-12, confirming what was already
true on GitHub — no visibility change made). The "repo private until the
public launch call" line this file previously carried was a launch-
sequencing placeholder from before the site existed, never actually
enforced on GitHub, and moot regardless now that the site is live. Same
public-by-default stance as `theprojection-site`.

## Content-writer contract

Registry-derived content — `content/changelog/*.md`, `data/records.yaml`,
`data/regulators.yaml` — is written ONLY by the `mhinbrief` adapter,
which lives at `mhinbrief-corpus/publish/adapter.py` (instance code, not
engine code) and calls kestrel's publish core for the guarantees. This is
the single-content-writer invariant, design §1: "A site repo has exactly one
content writer: the publish core, through that site's adapter." Do not
hand-edit those files — edits belong upstream in the data repo.

Editorial chrome — templates/layouts, CSS, and the hand-authored editorial
pages (`method.md`, `newsletter.md`, `topics/tax.md`, section `_index.md`
copy) — is normal repo-owned code, edited directly. Those pages carry
framing prose only; record facts, citations and dates come from `data/` at
render time, never typed into markdown. The invariant governs generated
registry/changelog exports, not the site chrome.

## Build & deploy

- Local: `hugo` (site builds with v0.111.3-extended; no theme deps, no
  modules, no external assets — fonts are self-hosted in `static/fonts/`).
  **Verify with plain `hugo`, not `hugo --minify`** — production uses the
  former, and minified output strips attribute quotes (`class=foo` vs
  `class="foo"`), which silently breaks greps calibrated on the wrong one.
- **Deploy target: a Cloudflare Worker with static assets — not
  Cloudflare Pages**, despite what earlier docs here claimed. Checked
  directly (2026-08-12) against Cloudflare's deployments API: every
  deployment ever recorded for this site shows `source: wrangler`, none
  show a connected build — the "Cloudflare Pages" framing was likely
  never accurate, for the old `therapybulletin` site or this one.
  `wrangler.toml`'s `[assets]` block points at `public/`,
  `main = "worker/index.js"` handles the one dynamic route
  (`/api/feedback`), everything else falls through to the static build.
- **Deploy is a direct push to Cloudflare, not git-triggered at all:**

      hugo                              # build
      set -a && source .env && set +a   # exports CLOUDFLARE_API_TOKEN
      npx wrangler deploy               # ships public/ + worker/index.js

  `wrangler` authenticates non-interactively via `CLOUDFLARE_API_TOKEN`
  in `.env` (gitignored — see `.env.example` for the var name) — no
  `wrangler login` needed, and no separate build step happens on
  Cloudflare's side. `mhinbrief.com` is bound to the Worker via
  Cloudflare's Workers Custom Domains feature, which auto-manages the
  DNS record and TLS cert for that binding.
- **A `git push` alone deploys nothing.** `publish/adapter.py --push`
  (data repo) commits generated content into this repo's git history,
  which is real and useful, but is a separate action from the
  `wrangler deploy` above — landing a commit here does not put it live.
  Verify against served content (`curl -s https://mhinbrief.com/`) before
  treating anything as deployed.
- **Legacy, not currently functional:** `MHINBRIEF_DEPLOY_HOOK` in `.env`
  is inherited from older docs describing a deploy-hook pattern the
  evidence above says was likely never actually load-bearing. Firing it
  does nothing — there's no connected build for it to trigger. Kept
  rather than deleted in case a Workers Build connection is ever
  deliberately added (optional, not required for this deploy path).
- `static/_headers` carries the security headers; `enableRobotsTXT` and
  RSS/sitemap are on. No analytics.

## Design

"Survey map" system (brand package, 2026-07-31): chart-white `#F6F8F6`,
ink `#1F2823`, spruce `#1F5C45`, brass `#8A6B2E`, survey-red changed-marker
`#C13A2B`, graticule hairlines `#C7D0D4`; Spectral (headings) +
Public Sans (body). All tokens in `static/css/main.css`.
