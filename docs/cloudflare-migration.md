# Перенос NA GOLCI в Cloudflare

Код подготовлен и проверен локально. Здесь описаны действия для следующего этапа;
облачные ресурсы и DNS этим изменением не создавались. Публичная часть — Pages,
редактор — Worker на отдельном origin, черновики — D1, изображения и неизменяемые
снимки публикаций — приватный R2. Дизайн и noindex сохраняются до отдельного запуска.

## 1. Зафиксировать исходные данные

Перед миграцией временно прекратить редактирование старого сайта. Из его
авторизованной админки экспортировать `GET /api/content` (JSON с content и revision).
Не брать initialContent вместо текущей базы: там могут быть новые тексты, отзывы
и загруженные фото. Для каждого пути `/api/media/<uuid>.<jpg|png|webp>` в content
скачать оригинальные байты через защищённый старый API или экспорт хранилища.
Сохранить их в `uploads/` рядом с JSON, с теми же именами. Сохранить весь экспорт
в приватном резервном каталоге вне Git.

Если исходная D1 доступна в собственном аккаунте, резервную SQL-копию можно получить
через `wrangler d1 export <SOURCE_DB> --remote --output backup.sql`.
[Документация экспорта D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/).
У текущего Sites-хостинга доступ и экспорт согласуются отдельно; нельзя считать
локальную временную D1 копией опубликованного сайта.

Из JSON создать snapshot.json:
`{ "schemaVersion": 1, "revision": <export.revision>, "createdAt": "<UTC ISO date>", "content": <export.content> }`.
Затем `npm run build:public -- --snapshot /absolute/private/snapshot.json` и
`npm run check:public`. Это проверяет экспорт, фотографии и видео до переноса.
Seed нужен только для демонстрации с исходными данными.

## 2. Ресурсы и закрытый редактор

Создать отдельные D1 и приватный R2; заполнить копию примера
`wrangler.admin.jsonc` (строгий JSON). Указать database_id, bucket_name, настоящий
ADMIN_ORIGIN, PUBLIC_ORIGIN (сначала production `<project>.pages.dev`), Access issuer,
audience, allowlist email, Pages account/project. Не оставлять `REPLACE_`.

В Cloudflare Access создать приложение для **всего** домена админки с Allow только
нужных email. ACCESS_AUD — audience этого приложения, ACCESS_ISSUER — origin
`https://<team>.cloudflareaccess.com`. Worker дополнительно проверяет подпись,
срок JWT, issuer/audience/email; каждый изменяющий запрос требует точный Origin.
Пустая конфигурация запрещает вход. `workers_dev: false`, `preview_urls: false`
в примере исключают альтернативный публичный маршрут к редактору.

Для того же домена и более конкретного пути `/api/build/*` создать отдельное
Access приложение с Service Auth policy только для отдельного service token
сборщика. Не давать этому токену Allow для редактора и не использовать Bypass.
Он передаётся через CF-Access-Client-Id/Secret; Worker также требует независимый
Bearer BUILD_TOKEN. Подробности: [Access service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).
До открытия редактора проверить оба приложения и приоритет более конкретного пути.

Команды после проверки настроек и доступа:

```bash
npx wrangler d1 migrations apply DB --remote --config wrangler.admin.jsonc
npx wrangler secret put BUILD_TOKEN --config wrangler.admin.jsonc
npx wrangler secret put PAGES_API_TOKEN --config wrangler.admin.jsonc
npx wrangler secret put PAGES_DEPLOY_HOOK --config wrangler.admin.jsonc
npm run deploy:admin
```

BUILD_TOKEN — отдельное случайное значение минимум 32 байта; один и тот же секрет
ставится в Worker и production Pages build. PAGES_API_TOKEN получает только
необходимое чтение Pages в нужном аккаунте. Hook — production branch, хранить
как секрет. Ни один секрет не ставить в VITE_* или Git. Скрипт deploy:admin
отказывается запускаться без заполненной локальной конфигурации; это не заменяет
проверку секретов и Access в аккаунте.

## 3. Импорт текущего контента

Загрузить каждое экспортированное фото в новый R2, ключ `<uuid>.<extension>`,
content-type соответствует оригиналу. Пример для одного файла:

```bash
npx wrangler r2 object put <BUCKET>/<UUID>.webp --remote --file /private/uploads/<UUID>.webp --content-type image/webp
```

Сначала применить миграции к **новой пустой** D1. Затем импортировать только запись
`site_content` с id='uk', проверенным content, прежней revision и updated_at.
SQL строковые значения экранируются заменой каждой одинарной кавычки на две;
body — JSON.stringify(content). Сохранить INSERT в приватный import.sql и выполнить:

```bash
npx wrangler d1 execute DB --remote --config wrangler.admin.jsonc --file /private/import.sql
```

Не импортировать локальные тестовые publications. Через настоящий Access открыть
редактор, проверить тексты, контакты, порядок работ, отзывы и все изображения.
Сравнить revision с экспортом. Если источник менялся после экспорта, экспортировать
снова до запуска первого выпуска; не перезаписывать пользовательские изменения.

## 4. Pages и первый выпуск

После интеграции проверенной ветки подключить GitHub `pashachee-ua/nagolci`
к Pages. Root directory — корень репозитория сайта, production branch — main,
build command `npm run build:public -- --remote`, output directory `dist/public`,
Node.js 22.13+ (например NODE_VERSION=24). Pages автоматически задаёт CF_PAGES_URL;
его не заменять постоянным origin: это URL конкретной сборки.
[Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/).

В production build secrets установить BUILD_ORIGIN (админка), BUILD_TOKEN,
CF_ACCESS_CLIENT_ID и CF_ACCESS_CLIENT_SECRET. Не копировать production credentials
в preview; отключить preview branch builds. Создать production deploy hook,
записать его Worker secret. [Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/).
Автоматический первый build до наличия снимка должен завершиться ошибкой —
безопасного fallback на seed нет. После настройки hook сохранить/проверить импорт
в админке и нажать «Опублікувати»: этот первый выпуск создаст снимок и запустит build.

Билд получает один снимок и читает загруженные фото только по его ID. Редактирование
во время сборки меняет черновик, а не этот выпуск. Рабочий hook означает queued,
не «опубликовано». Успех подтверждается API Pages и совпадением ID/revision в
`publication.json` на immutable deployment URL и PUBLIC_ORIGIN. Проверить оба
манифеста, статический HTML с отключённым JS, видео, lightbox и мобильное меню.

При 4xx hook или точной ошибке deployment появляется повтор. При сетевом timeout
статус unknown остаётся заблокированным: провайдер мог принять запрос. Проверить
Pages jobs/deployments и манифесты, не запускать ещё один hook вслепую. Если сборка
не дошла до build API, hook job может не разрешиться в deployment ID; требуется
оператор. Только после доказанного отсутствия активной сборки можно адресно
обновить эту запись D1 в failed (по ID), сохранив аудит причины. При реально
успешном выпуске исправить PUBLIC_ORIGIN/API доступ и обновить статус в UI.

## 5. Домен и откат

Покупку домена и DNS выполнять отдельным этапом. Сначала проверить новую Pages
публикацию по служебному адресу. Добавить домен через Pages Custom domains и
дождаться сертификата. После подключения поменять Worker PUBLIC_ORIGIN на
канонический HTTPS origin; сохранить точный ADMIN_ORIGIN отдельного поддомена.
Не включать Access на публичном портфолио. Для запуска индексации отдельно убрать
noindex из template и _headers и пересобрать.

Сохранить прежний сайт, экспорт, прежний deployment ID и DNS значения. При проблеме
вернуть DNS/предыдущий Pages production deployment. Во время отката остановить
публикации; активный выпуск не должен перезаписать откат. История снимков в R2
сохраняется, но ручной rollback не меняет автоматически статус succeeded в D1:
проверить публичный manifest и следующую публикацию с оператором. Новая D1/R2
остаётся источником черновиков и не очищается при откате.
