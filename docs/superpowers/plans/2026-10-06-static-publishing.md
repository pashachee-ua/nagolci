# NA GOLCI Static Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if the user selects delegation. Implement task-by-task; checkboxes track completion.

**Goal:** Build the existing portfolio as static HTML and give its editor a separate, authenticated draft-and-publish backend.

**Architecture:** Two Vite entrypoints reuse the current public components and Editor. A build-time React renderer produces public HTML from an immutable content snapshot; an admin Worker owns D1/R2, Access authentication and publication requests. Pages publication is an adapter that can be tested locally without cloud credentials.

**Tech Stack:** Existing React 19, TypeScript, Vite 8, Cloudflare Worker/D1/R2, Cloudflare Access; a maintained JWT verification library for Access validation.

**Spec:** `docs/superpowers/specs/2026-10-06-static-publishing-design.md`

## Global Constraints

- Work in `site-wow`; preserve the current design, Ukrainian language, gallery, reviews, videos and accessibility.
- Public HTML must not query D1 or render React at request time; keep `noindex` until launch is requested.
- Save creates a draft. Publish uses a saved, immutable revision; uploading a photo does not start a build.
- Public resources are static, including copies of R2 uploads referenced by the publication snapshot.
- Do not create Cloudflare resources, change DNS or replace the existing chatgpt.site publication during local implementation.
- Production builds fail if their snapshot or a referenced media object is unavailable. No seed fallback in production.
- Keep credentials server-side and outside Git. Missing production authentication configuration denies access.
- Preserve the existing revision conflict and image upload limits: at most 100 works, JPG/PNG/WebP, 8 MiB per image.
- No unrelated visual changes, CMS replacement, languages or booking features.

## Review Focus

- Saving during a build must not change the selected snapshot; test in Task 4.
- Uploaded-media paths must not permit traversal or fetch arbitrary URLs; test in Task 1.
- A spoofed email header or JWT with the wrong audience must never grant editor access; test in Task 3.
- Duplicate requests and hook timeouts must not launch concurrent releases; test in Task 4.
- Build failures, stale deployment status and browser reloads must not falsely report publication success; test in Tasks 4–5.

## File Map

- `static/snapshot.ts`, `static/media.ts`: validate build input, map media and verify local files.
- `static/render.tsx`, `static/client.tsx`, `static/template.ts`, `vite.public.config.ts`, `scripts/build-public.mjs`: generate HTML and browser bundle.
- `admin/client.tsx`, `admin/index.html`, `vite.admin.config.ts`: standalone Editor application.
- `worker/index.ts`, `worker/auth.ts`, `worker/content.ts`, `worker/uploads.ts`, `worker/publications.ts`, `worker/pages-provider.ts`: focused Worker modules.
- `shared/publication.ts`: snapshot and status types shared by build, Worker and UI.
- `drizzle/0001_publications.sql`: immutable publication records and active-release state.
- `wrangler.admin.example.jsonc`, `.env.example`, `README.md`, `docs/cloudflare-migration.md`: executable configuration examples and migration procedure.
- `tests/static-*.test.ts`, `tests/worker-*.test.ts`, `tests/publications.test.ts`, `tests/static-browser.*`: boundary, integration and browser verification.

### Task 1: Immutable Snapshot and Static Media

**Files:** Create `shared/publication.ts`, `static/snapshot.ts`, `static/media.ts`, `tests/static-snapshot.test.ts`, `tests/static-media.test.ts`.

**Interfaces:**
- `ContentSnapshot = { schemaVersion: 1; revision: number; content: SiteContent; createdAt: string }`.
- `parseSnapshot(value: unknown): ContentSnapshot` validates metadata and uses existing `validateContent`.
- `prepareMedia(snapshot: ContentSnapshot, options: { publicDir: string; outputDir: string; readUpload: (key: string) => Promise<Uint8Array> }): Promise<ContentSnapshot>` returns a copy with upload paths mapped to `/media/<key>`; original snapshot remains unchanged.

- [ ] Write failing tests: valid seed survives validation; negative/noninteger revision fails; script-link content fails; a snapshot is not mutated by media preparation.
- [ ] Write failing tests: referenced seed images and gallery/process videos must exist; upload gets copied once; missing upload fails; traversal, encoded traversal and arbitrary external media URLs fail.
- [ ] Run `node --experimental-strip-types --test tests/static-snapshot.test.ts tests/static-media.test.ts`; verify failure is missing implementation.
- [ ] Implement snapshot parsing and media preparation using exact UUID raster keys already accepted by `lib/validation.ts`; enumerate video/poster references from `lib/portfolio-media.ts`.
- [ ] Run both tests; require zero failures. Commit `feat: prepare immutable static content snapshots`.

### Task 2: Public HTML and Hydration

**Files:** Create `static/render.tsx`, `static/client.tsx`, `static/template.ts`, `vite.public.config.ts`, `scripts/build-public.mjs`, `tests/static-render.test.ts`; modify `package.json`, `app/portfolio.tsx` only if deterministic year injection is needed.

**Interfaces:**
- `renderPortfolio(snapshot: ContentSnapshot): string` renders the existing Portfolio, without Vinext request APIs.
- `serializeSnapshot(snapshot: ContentSnapshot): string` escapes `<`, `>`, `&`, U+2028/U+2029 in JSON used in an inert script element.
- `build:public` writes `dist/public/index.html`, hashed browser assets, static media, `_headers` and `publication.json` containing revision and publication ID when present.
- CLI source mode is explicit: `--seed`, `--snapshot <absolute-file>` or `--remote`; remote mode requires server credentials in environment. No ambiguous default or remote-to-seed fallback.

- [ ] Write failing render tests: HTML includes artist name, biography, contacts and reviews; malicious text cannot terminate snapshot script; no admin code or draft API reference is emitted.
- [ ] Run tests and verify the missing renderer failure.
- [ ] Add independent Vite browser/SSR-build configurations; build-time renderer imports existing components and CSS; client hydrates the same Portfolio and snapshot. Use a snapshot-derived year consistently if Portfolio currently reads the current clock.
- [ ] Implement staged output: only replace the previous `dist/public` after validation, render and asset generation succeed; attach existing title, description, favicon, `lang=uk` and `noindex`.
- [ ] Run render tests and `npm run build:public -- --seed`; inspect HTML for full content and ensure all referenced local files exist.
- [ ] Serve output with a plain static HTTP server; verify gallery/lightbox, Escape, mobile navigation, reviews and video at 390px and 1440px. Confirm no hydration warnings and no `/api/content` request. Commit `feat: generate static portfolio with React hydration`.

### Task 3: Independent Authenticated Editor Backend

**Files:** Create `admin/client.tsx`, `admin/index.html`, `vite.admin.config.ts`, `worker/index.ts`, `worker/auth.ts`, `worker/content.ts`, `worker/uploads.ts`, `tests/worker-auth.test.ts`, `tests/worker-content.test.ts`, `wrangler.admin.example.jsonc`; modify `.env.example`, `package.json`.

**Interfaces:**
- `WorkerEnv` includes `DB`, `FILES`, `ASSETS`, `ADMIN_ORIGIN`, `EDITOR_EMAILS`, `ACCESS_ISSUER`, `ACCESS_AUD`, `BUILD_TOKEN`; later tasks add provider settings.
- `authenticateEditor(request: Request, env: WorkerEnv): Promise<{ email: string } | null>` verifies Access JWT using issuer JWKS and an allowlist. Inject a local JWKS server in tests, never an identity bypass in production.
- `handleContent(request: Request, env: WorkerEnv): Promise<Response>` handles GET draft and PUT revision-checked save; every route is gated by the Worker router.
- `handleUpload(request: Request, env: WorkerEnv): Promise<Response>` preserves streaming size and raster signature checks.
- `GET /api/media/:key` on editor origin is authenticated; public visitors use static copies from Task 1.

- [ ] Write failing auth tests: unsigned JWT, spoofed email, expired token, wrong issuer/audience and disallowed email fail; a valid signed editor token passes; missing configuration fails closed.
- [ ] Write failing request tests: anonymous/cross-origin writes fail, stale revision returns 409, malformed content and non-raster upload fail, oversized stream returns 413, uploaded image bytes round-trip.
- [ ] Run tests and confirm missing Worker module failures.
- [ ] Install and pin a current JWT library compatible with Workers after checking its official documentation; implement JWT validation and exact-origin mutation checks. Refactor D1 helpers to accept bindings explicitly instead of importing `cloudflare:workers` at module scope.
- [ ] Add separate client build that loads authenticated draft data and reuses Editor. Router returns admin assets only after authentication, returns 404 for unknown API routes and does not serve SPA HTML for API failures.
- [ ] Run auth/content integration tests with temporary local D1/R2 via Wrangler/Miniflare; require zero failures. Build both public and admin bundles. Commit `feat: separate editor backend and Cloudflare Access authentication`.

### Task 4: Publication Snapshots and Provider State

**Files:** Create `worker/publications.ts`, `worker/pages-provider.ts`, `tests/publications.test.ts`, `drizzle/0001_publications.sql`; extend `shared/publication.ts`, `worker/index.ts`, `static/snapshot.ts`, `scripts/build-public.mjs`.

**Interfaces:**
- `PublicationStatus = 'requesting' | 'queued' | 'building' | 'succeeded' | 'failed' | 'unknown'`.
- `Publication = { id: string; revision: number; status: PublicationStatus; createdAt: string; deploymentId: string | null; error: string | null }`.
- `PublicationProvider.request(id: string): Promise<{ jobId: string | null }>` triggers a hook; `reconcile(publication: Publication): Promise<Publication>` uses provider status plus the deployed public manifest to establish exact revision success.
- `POST /api/publications` takes `{ revision: number }`; atomically reserves the only active publication, records immutable snapshot in R2 and triggers provider. Stale draft returns 409; same active revision returns existing record.
- `GET /api/publications/latest` returns editor-safe status; `GET /api/build/snapshot` reads the active immutable snapshot using BUILD_TOKEN, never a draft. Build media reads use the same separate credential and restrict keys to that snapshot.

- [ ] Write failing tests with fake provider: saving draft revision N+1 leaves release N unchanged; two publish requests reserve one release; same-revision retries do not call hook twice; different active revision conflicts; no active snapshot denies build access.
- [ ] Write failing tests: provider acceptance is not success; hook failure preserves draft; timeout enters `unknown` and does not blindly retry; old manifests cannot confirm new releases; confirmed provider success and matching manifest mark succeeded; failed build allows later retry.
- [ ] Run tests; confirm missing publication service failure.
- [ ] Implement D1 active-release transaction and R2 snapshot storage with compensation on snapshot failure. Reconcile `requesting`/`unknown` states before allowing a new release; keep historic snapshots. Implement fake provider for local integration and Pages adapter with env-only hook/API credentials.
- [ ] Add remote build input fetching: capture one active snapshot at start and use its ID for all media requests; fail on unavailable media or auth failure. Confirm live manifest matches exact publication ID before reporting success.
- [ ] Run publication integration tests and remote-build test against a fake provider/HTTP build endpoint. Commit `feat: publish immutable revisions and reconcile deployment status`.

### Task 5: Draft and Publish User Flow

**Files:** Modify `app/admin/editor.tsx`; create `admin/publication-controls.tsx`, `tests/editor-publication.*`; update WebMCP descriptions and save/upload/delete copy in Editor.

**Interfaces:**
- `PublicationControls({ savedRevision: number; dirty: boolean; busy: boolean })` fetches latest status, submits the saved revision and displays server-confirmed states in Ukrainian.
- Save keeps its `{ revision: number }` result and never invokes publication; successful save says `Зміни збережено як чернетку.`.

- [ ] Write failing browser tests: save changes draft but leaves served static page unchanged; dirty form disables Publish; accepted hook says publication requested; reload preserves pending state; failed build displays retry; only confirmed successful release says published.
- [ ] Run tests and confirm current Editor's live-save copy fails.
- [ ] Implement publication controls, bounded polling while pending and cleanup on unmount; update upload/delete wording to refer to publishing. Keep existing dirty-form warning, revision handling and accessible status region.
- [ ] Verify complete local flow using temporary D1/R2, a signed test identity and fake publication provider: edit, save, publish, build exact snapshot, confirm manifest, refresh static site. Commit `feat: add explicit draft and publish controls`.

### Task 6: Repeatable Verification and Migration Instructions

**Files:** Modify `README.md`, `.gitignore`, `package.json`; create `docs/cloudflare-migration.md`, `scripts/check-static-artifact.mjs`; extend `wrangler.admin.example.jsonc`.

**Interfaces:**
- `check-static-artifact.mjs <artifact-dir>` exits nonzero for missing referenced resources, leftover draft API paths, unexpected secrets or absent public HTML/content marker.
- Document scripts `dev:public`, `dev:admin`, `build:public`, `build:admin`, `test:publishing`; preserve the legacy Vinext workflow until migration verification is complete.

- [ ] Add artifact checker tests: valid output passes; missing photo, admin secret marker and `/api/media` public references fail. Run red, implement, run green.
- [ ] Document exact Cloudflare setup order, migration/export of current production data and R2 assets, Access configuration, separate build credentials, Pages hook/status credentials, deploy settings and domain cutover/rollback. Examples use explicit configuration placeholders and refuse production execution until replaced.
- [ ] Run TypeScript, existing tests, new publishing tests, public/admin builds and artifact checker; verify static browser flow at mobile/wide widths. Record commands and results in `docs/static-publishing-verification.md`.
- [ ] Obtain whole-branch review using the execution method selected by the user; address actual findings and rerun affected checks.
- [ ] Commit documentation and verified implementation. Report local readiness separately from cloud deployment readiness; ask only for account/domain values needed to connect the tested result. Do not push or deploy without scope authorization for this implementation branch.

## Execution Recommendation

Use native execution in this chat: the tasks share snapshot, authentication and publication interfaces, so one implementer can keep these boundaries consistent. Perform a fresh whole-branch review after local verification. Cloudflare-account integration follows once its settings are available.
