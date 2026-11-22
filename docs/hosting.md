# Hosting and verification

The public editor is live at https://klode.app/, served by Cloudflare Pages since
2026-11-16 (#57). Record exact deployment metadata and account settings
separately; the public URL alone does not establish every operational setting.

## Static hosting contract

Serve the entire static `dist/` output on the approved editor origin over HTTPS.
Preserve `/assets/` and `/runtime/` paths; the editor is hosted at the origin
root. The retired input spike is not a production build entry. Serve `.wasm` with
`Content-Type: application/wasm`, `.mjs` as JavaScript, and zip as binary data.
Set these response headers on HTML and worker/script responses:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Both window and module worker must report `crossOriginIsolated === true`.
SharedArrayBuffer and worker Atomics.wait are essential: a missing capability
produces a visible failure rather than a preloaded-input fallback. Vite dev AND
preview send the same headers. HTTP localhost is a browser secure-context exception
for local testing; this is not evidence for a production HTTPS origin.

All startup resources are bundled on the same editor origin. `npm ci` downloads
locked build dependencies; `npm run vendor:runtime` only verifies/copies local
npm files and refuses checksum drift. `npm run build` includes runtime files in
the static output. There are no CDN imports or import-triggered installation in
the application. A Python import absent from the bundled runtime fails normally.
This is not a security sandbox: arbitrary Python/JavaScript interoperation is not
restricted, and the exam network whitelist remains an environmental requirement.

The actual target is Microsoft Edge on the restricted Windows exam laptop.
Opening in a new window is provisional and needs confirmation on that laptop;
no embedded route is assumed. Confirm the Edge version, actual opening route,
approved origin and all required path rules with the school. Record a cold-cache
network log with every unapproved destination blocked. Verify COOP does not break
the school's opening workflow and native copy/paste into ans.app separately.
The product owner authorised local editor implementation after reporting the
HTTPS spike works in a Windows/Edge VM. Actual school-environment evidence and
independent review remain mandatory before exam-use release; see the dated
continuation decision in the feature specification. The product editor is at
`/`; application browser regressions now cover the former spike cases.

## Cloudflare Pages

The product owner decided on 2026-11-16 to host Klode on Cloudflare Pages, like
the sibling apps (#57). The same day, they pointed `klode.app` and
`www.klode.app` at the Pages project. Cloudflare manages both the DNS zone and
the custom domains. `www.klode.app` redirects to `https://klode.app/`. The
Pages deployment is also reachable at https://klode.pages.dev/. Cloudflare
provides HTTPS; no local test CA should be uploaded or imported for the public
site.

The product owner chose Cloudflare's Git integration: Cloudflare builds and
deploys each push to `main` itself. It does not wait for the GitHub checks.
Branch and PR previews are switched off: only the human-approved `main` is
published. A merge decision authorises publication of the approved version;
failed release checks stop further publication. Record the deployed commit and
verification results for each approved release.

Cloudflare installs the locked dependencies itself with `npm ci`. Node comes
from [.node-version](../.node-version). Its npm version is not pinned to
`packageManager` in [package.json](../package.json), unlike CI. No application
secrets or runtime environment variables are required. Do not set `NODE_ENV` to
`production`: build dependencies must be installed. The build verifies and
packages the pinned Python runtime before running Vite.

[`public/_headers`](../public/_headers) sets COOP/COEP on every path. Vite copies
it into `dist/`, where Cloudflare Pages applies it; without it the editor is not
cross-origin isolated. Vite dev and preview read the same file, and the tooling
check requires exactly the headers below.

One-time setup by the product owner, in Workers & Pages → Create → Pages →
Connect to Git:

| Setting | Value |
|---|---|
| Repository | `hanze-hbo-ict/klode` |
| Project name | `klode` |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | empty (repository root) |

After creating the project, open Settings → Builds & deployments → Branch
control and set preview deployments to **None**. Until that setting is saved,
Cloudflare may build preview deployments of other branches.

## Release verification

After an approved deployment, record the Cloudflare Pages deployment ID, exact Git commit,
build/runtime versions and URL. Confirm the published root is the Klode editor,
not the isolated spike. Verify HTTPS plus COOP/COEP headers on root HTML, worker
JavaScript and runtime responses; `.wasm` must use `application/wasm` and `.mjs`
a JavaScript MIME type. Confirm window and worker are cross-origin isolated.

Use a cold browser context with other network origins blocked. Check two interactive
prompts with accepted-answer echo/newlines, empty/Unicode answers, Stop during
input/loop/output flood, rerun, and exact native source copying. For feedback-round
releases, verify reload starts the normal initial source without application-managed
source recovery, including when an old storage value exists. Current source must
survive Run/errors/Stop/theme changes. Historical recovery checks describe only
their original commits. Observe all five runtime requests on the editor origin;
there must be no runtime CDN or package-install request. Native copy into ans.app
and the actual Windows/Edge school whitelist remain separate acceptance evidence
in #13, not implied by successful hosting smoke tests.

If build or live verification fails, stop and report the deployment/commit and
failure in #17; do not claim release completion. Local tests validate the committed
configuration/build but do not prove live response headers or hosting account settings.

Sources: [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/),
[build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) and
[headers](https://developers.cloudflare.com/pages/configuration/headers/).
