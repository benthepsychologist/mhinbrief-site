# therapybulletin-site

Hugo site for **Therapy Bulletin** (therapybulletin.org) — the verified
reference for the rules governing behavioural-health practice in Canada.
Name locked 2026-07-31; domains (.org/.com/.ca) owned; repo private until
the public launch call.

## Content-writer contract

Registry-derived content — jurisdiction records, topic-matrix cells,
changelog entries — is written ONLY by the kestrel publish core through
the `therapybulletin` adapter (the single-content-writer invariant,
design §1: "A site repo has exactly one content writer: the publish core,
through that site's adapter"). Do not hand-edit those sections.

Editorial chrome — templates/layouts, CSS, and the hand-authored editorial
pages (`method.md`, `newsletter.md`, section `_index.md` copy) — is normal
repo-owned code, edited directly. The invariant governs generated
registry/changelog exports, not the site chrome.

## Build & deploy

- Local: `hugo` (site builds with v0.111.3-extended; no theme deps, no
  modules, no external assets — fonts are self-hosted in `static/fonts/`).
- Cloudflare Pages: build command `hugo`, output directory `public`,
  environment variable `HUGO_VERSION=0.111.3`.
- **Push does NOT auto-deploy.** Like theprojection-site, this project
  builds only on its Cloudflare deploy hook, not on git push — a build
  connected to the GitHub repo alone will sit un-triggered indefinitely
  (found 2026-07-31: a real push of the jurisdiction-map/branding work
  sat live-unchanged for several minutes with no way to tell from this
  repo alone that a build hadn't even started). After every push that
  should go live, fire the hook by hand:
  `curl -X POST "$THERAPYBULLETIN_DEPLOY_HOOK"` — the URL lives in this
  repo's gitignored `.env` (see `.env.example` for the var name), never
  committed. Response includes a `build_uuid`; Cloudflare's dashboard is
  the only place to check build success/failure from here — no API
  token is configured in this environment to poll it directly.
- `static/_headers` carries the security headers; `enableRobotsTXT` and
  RSS/sitemap are on. No analytics.

## Design

"Survey map" system (brand package, 2026-07-31): chart-white `#F6F8F6`,
ink `#1F2823`, spruce `#1F5C45`, brass `#8A6B2E`, survey-red changed-marker
`#C13A2B`, graticule hairlines `#C7D0D4`; Spectral (headings) +
Public Sans (body). All tokens in `static/css/main.css`.
