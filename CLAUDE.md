# CLAUDE.md — therapybulletin-site

This repo is the **published surface only** — a Hugo site with exactly one
content writer: the kestrel engine's publish core, through therapybulletin's
adapter (`/workspace/kestrel/tools/publish/`, fed by `/workspace/therapybulletin-site`).

**Single-writer contract:** `data/` and `content/threads|entities|map|claim/*`
are generated and overwritten wholesale on every publish run — never
hand-edit them; edits belong upstream, in the data repo or the adapter.
Hand-authored pages (`content/about.md`, `content/metric/*.md`) are this
repo's own and are never touched by publish.

**What IS this repo's own code:** `layouts/`, `assets/css/`, `static/`,
`hugo.yaml`, `wrangler.toml` — templates, brand system, and site config are
edited and pushed here directly, same as any other Hugo site.

**Deploy:** the Cloudflare Workers Builds deploy hook, fired automatically
by `/publish --push` in the data repo, builds and deploys this site. A
bare template/CSS push does **not** auto-fire the hook — only a content
publish run does; fire it by hand (`curl -X POST` the hook URL) after a
template/CSS-only change.

**Upstream pointers:** engine — `/workspace/kestrel`; data/instance repo —
`/workspace/therapybulletin-site`.
