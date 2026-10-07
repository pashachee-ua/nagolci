# Проверка static publishing

2026-10-07, feature/static-publishing, база ветки 15971f8. Node 24.19.0.

- `npx tsc --noEmit` — успешно.
- `npm test` / `test:publishing` — 28/28. Существующие проверки галереи,
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

Независимый обзор всей ветки выполнен отдельным reviewer (GPT-6 Astra), без
истории исполнителя. Критических и отложенных мелких замечаний нет. Исправлены
три важных замечания:

1. Поздний hook ответ и конкурентный poll стирали deployment ID. Детерминированный
   тест воспроизвёл оба случая: `[hook-job-1, null]`; после исправления получены
   `[deployment-1, deployment-1]`. Hook jobs хранятся отдельно; status CAS также
   проверяет предыдущий deployment ID.
2. Второй deployment заменял привязку первого (ожидаемый 409, фактический 200).
   После исправления endpoint и provider отклоняют замену. Production Git builds
   в инструкции обязательно выключаются; выпуск кода тоже запускается из админки.
3. Node 22.13.0 без флага падал на `.ts` импорте. Проверено реальным Node 22.13.0:
   с `--experimental-strip-types` сборка проходит; флаг добавлен в package script.

После исправлений — TypeScript и весь набор 28/28 проходят. Wrangler --dry-run
с синтетическими валидными идентификаторами ресурсов собирает production Worker;
реальные ресурсы не создаются. dev:public и dev:admin запускаются успешно.

Обзор сознательно оставил этапу подключения аккаунта реальные Access policies,
секреты, DNS и Pages API. Автовосстановление непонятного hook timeout и коррекция
статуса после ручного rollback требуют оператора; это принятые ограничения.


Полный журнал решений: [static-publishing-execution.md](static-publishing-execution.md).
