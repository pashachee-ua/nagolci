# SDD ledger — plan: docs/superpowers/plans/2026-10-06-static-publishing.md
Baseline: 15971f8; linked worktree feature/static-publishing; 14 tests green.
Ruling: Native worktree tool cannot target nested repository (Not a git repository); used ignored linked Git worktree in selected site-wow repository.
Pre-flight: 1→2 snapshot/media interfaces match; 3→4 explicit bindings match; 4→5 status and revision interface match; 2→6 artifact interface matches.
Ruling: Publication ID is optional in local seed snapshots and mandatory in production snapshots; add id to ContentSnapshot — needed to identify the deployed exact release.
Ruling: Build endpoint needs separate Access service credentials at the edge plus BUILD_TOKEN at Worker; email identity alone will never authorize build endpoints.
Task 1: complete (commits 15971f8..eda3d74, tests: node --experimental-strip-types --test tests/static-snapshot.test.ts tests/static-media.test.ts → ℹ duration_ms 76.317334)
Task 2: complete (commits eda3d74..83212fc, tests: node --experimental-strip-types --test tests/static-render.test.ts → ℹ duration_ms 680.76575)

Task 3: Ruling: Kept legacy lib/store untouched; new Worker uses binding-injected content helpers to preserve the existing preview workflow. JWT unit tests use real signed keys; D1/R2 integration uses real Miniflare bindings.
Task 2 browser: photo lightbox, next video, Escape, mobile menu, review expansion passed; no console warnings/errors; actual DOM width 389px had no overflow; wide view also had no overflow.
Task 3: complete (commits 83212fc..1f806e3, tests: node --experimental-strip-types --test tests/worker-auth.test.ts tests/worker-content.test.ts → ℹ duration_ms 343.449375)

Task 4: Ruling: Hook transport errors stay unknown/locked; only definitive rejection or exact deployment failure permits retry. Builds attach CF_PAGES_URL to resolve a hook job to the exact deployment ID. If neither can be resolved, require operator reconciliation rather than guess.
Ruling: Artifact-producing tests run serially because they share dist/public; all other tests retain normal async behavior.
Task 4: complete (commits 1f806e3..bd4f441, tests: node --experimental-strip-types --test --test-concurrency=1 tests/publications.test.ts tests/pages-provider.test.ts tests/static-remote.test.ts → ℹ duration_ms 1605.719625)
Task 5: complete (commits bd4f441..0c031e1, tests: npm test → ℹ duration_ms 3610.865583)
Task 5 browser: complete draft/save/publish/reload/failure/retry/confirmed manifest flow; tests/editor-publication.md records it.
Task 5: Ruling: Retain live-save wording only for legacy Vinext Editor; separate admin passes publishing=true and public URL from Worker — preserves the old workflow; cost if wrong: users of legacy admin may expect drafts.
Task 6: Ruling: dev:admin uses a clearly identified localhost-only disposable signed-identity test harness, not an auth bypass in deployed code — allows repeatable full UI verification without cloud credentials; cost if wrong: local data is temporary.
Task 6 RED: artifact checker missing; GREEN: rejects missing media, API paths, secrets, incomplete HTML. 26/26 suite and tsc green; both builds and legacy build green.
Final review: fresh-context GPT-6 Astra; 3 Important findings, no Critical/minors. All Important grades accepted by user effect.
Final: fixed late hook and stale poll overwriting deployment correlation — deterministic paused hook/poll test RED→GREEN, suite 28/28. Separate hook_job_id, correlation CAS, monotonic attachment.
Final: fixed second deployment replacing tracked build and allowing overlapping automatic Git builds — second-build 200→409 test RED→GREEN, suite 28/28; mandatory disable-production-autobuild instructions.
Final: fixed minimum Node22.13 public build failure — real Node22.13 ERR_UNKNOWN_FILE_EXTENSION RED→GREEN with explicit strip-types flag; suite 28/28.
Final: Ruling: Live account/Access/DNS behavior is deferred to cloud integration — spec explicitly limits this stage to local implementation; cost if wrong: production integration may still reveal API/config mismatches.
Final: Ruling: Keep uncertain uncorrelated hook releases locked for operator reconciliation — prevents duplicate releases on uncertain acceptance; cost if wrong: operator intervention and longer publication delay.
Final: Ruling: Manual Cloudflare rollback status is corrected by the operator with publication paused — manual account actions bypass this backend's release process; cost if wrong: editor can temporarily show historical succeeded status.
Final: no deferred minors.
Task 6: complete (commits 0c031e1..8985967, tests: npm test → ℹ duration_ms 3860.186958)
