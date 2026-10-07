# Проверка static publishing

2026-10-07, feature/static-publishing, база ветки 15971f8. Node 24.19.0.

- `npx tsc --noEmit` — успешно.
- `npm test` / `test:publishing` — 26/26. Существующие проверки галереи,
  контактов, отзывов и upload signatures сохранены.
- Настоящие подписанные JWT (подпись/issuer/audience/expiry/email), Miniflare
  D1/R2; внешний Pages provider подменён на границе API.
- Публикации: конкурирующие запросы, сохранение во время сборки, snapshot/media
  auth, неуверенный hook timeout, terminal failure/retry и старые manifests.
- Remote build через настоящий локальный HTTP build API: закреплённый revision,
  загруженное изображение копируется в статический файл, более новый draft не попадает.
- Artifact checker: отсутствующий файл, API-медиа, секрет и неполный HTML отклоняются.
  Проверка встроена до замены предыдущего dist/public.
- `npm run build:public -- --seed`, `npm run build:admin`, `npm run check:public` — успешно.
- `npm run build` — прежний Vinext build успешно. Он очищает dist: после него
  нужно заново собрать public/admin; не запускать оба workflow одновременно.
- `node scripts/deploy-admin.mjs` без заполненной локальной конфигурации —
  корректный отказ (exit 1), облачный деплой не запускался.

Браузер: реальные статические файлы через HTTP, без SSR сервера. Проверены
viewport 1440×900 и 390×844 (ширина content area 1425/375 из-за scrollbar),
без горизонтального переполнения. Lightbox, следующая работа-видео, Escape,
мобильное меню, разворачивание отзывов; предупреждений hydration не обнаружено.
Полный сценарий админки: [editor-publication.md](../tests/editor-publication.md).

Cloudflare Access policies, реальные Pages hooks, удалённые D1/R2 и домен
нуждаются в проверке в аккаунте на этапе миграции. Локальные тесты не подменяют
такую проверку. Порядок: [cloudflare-migration.md](cloudflare-migration.md).

Независимый обзор всей ветки и исправления записываются ниже после завершения.
