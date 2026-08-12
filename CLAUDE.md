# CLAUDE.md — mhinbrief-site

This repo is the **published surface only** — a Hugo site with exactly one
content writer: the `mhinbrief` adapter at
`/workspace/mhinbrief-corpus/publish/adapter.py`, which calls kestrel's
publish core (`/workspace/kestrel/tools/publish/core.py`) for the guarantees
(secret scan, field allowlist, no-empty-wipe, provenance). The adapter is
**instance code in the data repo**, not engine code.

**Single-writer contract — what is GENERATED here, never hand-edit:**
- `content/changelog/*.md` — one page per changelog entry
- `data/records.yaml` — allowlisted record fields
- `data/regulators.yaml` — the jurisdiction map's regulator lists

Edits to any of those belong upstream, in `mhinbrief-corpus` (the
records/changelog, or the adapter that renders them). A second writer into
this site is the specific failure mode the contract exists to prevent — a
temporary bridge script once produced `data/regulators.yaml` from inside
this repo and was absorbed into the adapter and deleted on 2026-07-31.

**Hand-authored pages that are this repo's own** and are never touched by
publish: `content/_index.md`, `content/method.md`, `content/newsletter.md`,
and the section framing pages `content/jurisdictions/_index.md`,
`content/topics/_index.md`, `content/topics/tax.md`. These carry editorial
prose only — never record facts, citations, dates, or figures, which must
come from `data/` at render time.

**What else IS this repo's own code:** `layouts/`, `static/` (including
`static/css/main.css` — note `static/`, not `assets/`), `static/img/`,
`static/js/`, `hugo.yaml`, `wrangler.toml`. Templates, brand system and
site config are edited and pushed here directly, same as any Hugo site.

**Deploy — the trap:** this site does **NOT** auto-deploy on git push, and
it is **not** Cloudflare Pages or a git-connected build — checked directly
against Cloudflare's deployments API (2026-08-12): every deployment ever
recorded for this site, back to when it first went live 2026-07-31, shows
`source: wrangler`, none show a connected build. The old docs described a
"push → deploy hook → Cloudflare build" pipeline that the evidence says
was likely never the real mechanism. `mhinbrief` is a Cloudflare
**Worker with static assets**, deployed by pushing the build straight to
Cloudflare, not by anything git-triggered — same as it's always actually
been:

    hugo                                  # build to public/
    set -a && source .env && set +a       # exports CLOUDFLARE_API_TOKEN
    npx wrangler deploy                   # uploads public/ + worker/index.js

`wrangler deploy` authenticates non-interactively via `CLOUDFLARE_API_TOKEN`
in this repo's gitignored `.env` — no `wrangler login` needed. `mhinbrief.com`
is bound to the deployed Worker via Cloudflare's Workers Custom Domains
feature (DNS + cert auto-managed by that binding — don't hand-edit DNS
records for this zone, they're not meant to be edited directly).

`publish/adapter.py --push` from the data repo still does something real —
it builds and commits `content/changelog/*.md`, `data/records.yaml`,
`data/regulators.yaml`, `data/review.yaml` into THIS repo's git history —
but that commit alone does **not** put anything live anymore. Getting a
change onto `mhinbrief.com` is the separate `hugo && wrangler deploy` pass
above, run after the adapter's push has landed. A clean `git push` (from
either repo) is not evidence the site updated — verify against served
content, e.g. `curl -s https://mhinbrief.com/ | grep <marker>`.

**Legacy, not currently functional:** `MHINBRIEF_DEPLOY_HOOK` in `.env` is
inherited from older docs describing a deploy-hook pattern that, per the
above, was likely never actually load-bearing. Firing it does nothing —
no connected build exists to trigger. Left in `.env`/`.env.example`
rather than deleted so it's not confused for missing config if a Workers
Build connection is ever deliberately added (optional — the direct
`wrangler deploy` path works fine without one).

**Upstream pointers:** engine — `/workspace/kestrel`; data/instance repo —
`/workspace/mhinbrief-corpus`.
