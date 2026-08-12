# STATUS — mhinbrief-site (published surface)

*Hand-maintained. **As of 2026-08-12** (newest note first.)*

**Where things actually stand right now:**

| | |
| --- | --- |
| **Live at** | mhinbrief.com — Cloudflare Worker `mhinbrief`, custom domain bound via Workers Custom Domains (cert auto-provisioned). The zone was already active on the account before this session; no DNS/registration work was actually needed. |
| **Deploy mechanism** | Direct `wrangler deploy` (`hugo` build + `wrangler` push), authenticated via `CLOUDFLARE_API_TOKEN`. **Not** a deploy hook / connected build — checked directly against Cloudflare's deployments API: every deployment this site has ever had shows `source: wrangler`. |
| **Content** | 16 changelog pages + 3 generated data files (`records.yaml`, `regulators.yaml`, `review.yaml`), all written by `mhinbrief-corpus`'s `publish/adapter.py` — this repo hand-authors only templates/chrome/editorial prose. |
| **Review pipeline** | Live: `/review/` (unlisted, Access-gated to `@evidencefirstsolutions.com`) + `POST /api/feedback` (`worker/index.js`), verified end to end against the real deploy 2026-08-12 — unauthenticated requests to both paths correctly redirect/401, public pages (`/`, `/changelog/`) unaffected. |
| **Worker** | `worker/index.js` (routing + GitHub issue creation) + `worker/access-jwt.js` (Access token verification). `GITHUB_TOKEN` set as a Worker secret (fine-grained PAT, `Issues: write` on `mhinbrief-corpus` only). |
| **Rename** | `therapybulletin-site` → `mhinbrief-site`, 2026-08-12 — GitHub repo renamed (Ben, via web UI), local remote updated to the canonical URL after confirming the redirect worked. |

> **2026-08-12 — stood up as a live Cloudflare Worker (not Pages), review
> pipeline shipped with Access-verified feedback, deploy docs corrected
> against actual Cloudflare history.** Full narrative in
> `mhinbrief-corpus/STATUS.md`'s 2026-08-12 entries — this repo's own
> facts are summarized in the table above rather than duplicated here.
> One thing worth restating locally: the "Cloudflare Pages, deploy hook"
> framing this repo's docs carried before today was checked against
> Cloudflare's own deployments API and found to likely have never been
> accurate, for this site or its predecessor — corrected here and in
> CLAUDE.md/README.md (commit `0914ff3`).
