# NA GOLCI

Тот же дизайн site-wow, с двумя независимыми приложениями: статическое портфолио
и защищённая админка. Сохранение создаёт черновик, кнопка публикации закрепляет
его версию и запускает пересборку. Публичный сайт читает готовые HTML и файлы;
база и серверный рендер при посещении страницы ему не нужны.

Требуется Node.js 22.13+ и npm. После `npm ci`:

| Команда | Результат |
| --- | --- |
| `npm run dev:public` | Собрать начальный контент и открыть статический сервер на localhost:4320 |
| `npm run dev:admin` | Собрать админку и запустить временную локальную D1/R2 на localhost:4321/admin |
| `npm run build:public -- --seed` | Локальный начальный контент → dist/public |
| `npm run build:public -- --snapshot /absolute/path/snapshot.json` | Проверенный экспорт + соседняя uploads/ → dist/public |
| `npm run build:public -- --remote` | Закреплённая версия и медиа с build API → dist/public |
| `npm run build:admin` | Клиент админки → dist/admin |
| `npm run test:publishing` | Весь набор тестов, включая прежние проверки |
| `npm run check:public` | Проверить готовые HTML, ресурсы и отсутствие серверных секретов |
| `npx tsc --noEmit` | Проверить TypeScript |

Локальная админка использует **тестовую подписанную личность** и провайдер публикации.
Данные временные, исчезают при остановке процесса. Это проверка интерфейса и
реальных D1/R2 bindings, а не вход в production и не настоящий деплой.
Для разработки только интерфейса есть `dev:admin:ui`; API ему нужен отдельно.
Браузерный сценарий: [tests/editor-publication.md](tests/editor-publication.md).

Production deployments запускает только кнопка публикации через hook; автоматические
Git builds должны быть отключены (включая production). После push кода нужен новый
выпуск из админки. Production принимает только `--remote`: нужны BUILD_ORIGIN, BUILD_TOKEN и Access
service credentials. Сбой источника или отсутствие фото останавливает сборку;
предыдущие готовые файлы сохраняются. `--seed` не используется как запасной вариант.

Пошаговая настройка аккаунта, перенос данных, домен и откат:
[docs/cloudflare-migration.md](docs/cloudflare-migration.md).
Результаты локальных проверок: [docs/static-publishing-verification.md](docs/static-publishing-verification.md).
`wrangler.admin.example.jsonc` — пример; `deploy:admin` требует отдельный полностью
заполненный `wrangler.admin.jsonc`, который исключён из Git.

Прежний Vinext workflow сохранён: `npm run dev -- --port 4318`, `npm run build`,
`npm start`. Его `/admin` сохраняет изменения непосредственно для прежней версии.
Новая отдельная админка работает через черновики и публикации. Vinext build очищает
весь dist; после его проверки нужно заново собрать public/admin.
Концепция дизайна: [docs/wow-design.md](docs/wow-design.md).
