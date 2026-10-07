# Browser acceptance: draft and publish

Run `npm run build:admin`, then `node --experimental-strip-types tests/helpers/dev-admin.ts`.
Serve `dist/public` on localhost:4320. The disposable localhost:4321 harness uses signed
JWTs, real Miniflare D1/R2 and a fake provider. It is never part of the production bundle.
Use the browser UI to perform the following; change only fake provider state with
`POST /__test/provider {"phase":"succeeded"}` or `{"phase":"failed"}`.

Verified 2026-10-07 using Codex browser tools:

1. RED: old editor had zero `Опублікувати` buttons and live-save copy.
2. Changing `Ім’я майстра` to `Павло — чернетка` disabled Publish.
3. Saving showed `Зміни збережено як чернетку.`; static page lacked this name.
4. Publish showed a pending build, never success; reload retained pending status.
5. `BUILD_ORIGIN=http://127.0.0.1:4321 BUILD_TOKEN=local-build-test-token-not-production npm run build:public -- --remote`
   built revision 1. Fake provider success then showed `Опубліковано · версія 1.`.
   The static artist heading contained `ПАВЛО — ЧЕРНЕТКА` (design uppercases names).
6. Saving `Павло — наступна версія` showed new saved changes; static heading remained
   the old version. Failed publication showed failure and enabled `Спробувати ще раз`.
7. Retry showed building, disabled another publish; editor console had no warnings/errors.

A test-harness header casing bug initially produced an Origin rejection: default
`Origin` and incoming `origin` were combined. Normalizing with Headers.set fixed
only the fixture; production Origin protection remained intact.
