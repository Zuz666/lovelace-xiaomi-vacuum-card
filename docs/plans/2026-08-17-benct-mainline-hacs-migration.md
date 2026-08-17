# Переход на benct-mainline и выпуск HACS v4.6.0

## Context

Текущий `Zuz666/lovelace-xiaomi-vacuum-card` является GitHub-форком заброшенного `3ative/lovelace-xiaomi-vacuum-card`, а рабочая ветка `fix/modern-ha-compatibility` основана на несвязанном orphan-root. Целевое состояние: прямой GitHub-форк `benct/lovelace-xiaomi-vacuum-card`, собственная защищённая ветка `main`, вся разработка и агентские инструкции внутри одного проекта, открытая Node/Playwright/HACS-инфраструктура и первый поддерживаемый HACS Custom Repository release `v4.6.0`. Существующие 51 коммит и тестовая инфраструктура сохраняются; после миграции исправляются два дефекта template-service path и совместимость батареи с Home Assistant 2026.8. Утверждённый план должен быть сохранён в истории проекта как `docs/plans/2026-08-17-benct-mainline-hacs-migration.md`.

## Approach

### 1. Зафиксировать исходное состояние и назначение всех веток

1. Перед изменением истории проверить чистый working tree и зафиксированные якоря:
   - `HEAD = a45288c634b7a22db7e942066f922fb8d2ebcb0e`;
   - orphan-root `0c620cf467b7b81c975a2dee8a02eed62d983675`;
   - `git rev-list --count 0c620cf..HEAD` возвращает `51`;
   - SHA-256 `dist/xiaomi-vacuum-card.js` равен `329b231f092dea3a36ea4e845d6e7a73a4ffc71a2916b435385f4b9961ed9bfc`.
2. Создать и проверить локальный bundle `.git/migration-backups/pre-benct-migration.bundle` командой `git bundle create … --all`; это единственная резервная копия, содержащая все локальные refs, включая не опубликованные backup-ветки.
3. До архивирования старого GitHub-репозитория опубликовать в нём неизменяемые архивные refs:
   - текущий tip — `archive/fix-modern-ha-compatibility` и annotated tag `pre-benct-mainline-a45288c`;
   - `main` (`58329c1…`) — `archive/main`;
   - `xvc-version-rewrite` (`9cd7533…`) — `archive/xvc-version-rewrite`;
   - `xvc-rewrite-backup-7bc66cd` (`7bc66cd…`) — `archive/xvc-rewrite-backup`;
   - `backup/fix-modern-ha-compatibility-before-squash-20260606` (`28b3638…`) — `archive/pre-squash`;
   - `origin/chore/project-structure-release-testing` (`7b670c3…`) — `archive/project-structure-release-testing`.
   Эти refs являются только историей восстановления: их не переносить в новый mainline-репозиторий.
4. Содержимое `origin/chore/project-structure-release-testing` уже входит в `a45288c`; сохранить package/lockfile, ESLint, Prettier, `node:test`, Playwright, Docker smoke, CI, release workflow и contributor templates, а не создавать параллельный набор инструментов.

### 2. Перестроить историю на каноническом benct lineage

1. Добавить единственный upstream remote `upstream = git@github.com:benct/lovelace-xiaomi-vacuum-card.git` и fetch. Пин миграции — `benct/master`/`v4.5.0` commit `44d53f9758c65449389b6d2cb8709321aefc7290`; собственная целевая ветка всё равно называется `main`.
2. На временной ветке `migration/benct-base` от `44d53f…` создать один synthetic-base commit `chore: establish benct fork baseline`:
   - переместить upstream `xiaomi-vacuum-card.js` в `dist/xiaomi-vacuum-card.js`;
   - поверх него восстановить из `0c620cf…` ровно `dist/xiaomi-vacuum-card.js`, `README.md` и `hacs.json`, чтобы не потерять исходную modern-HA/MWC migration, находившуюся в orphan-root;
   - сохранить upstream `LICENSE`, `CHANGELOG.md`, `examples/` и `img/` без переписывания;
   - оставить `tracker.json` до отдельного инфраструктурного commit, чтобы synthetic commit описывал только смену lineage/layout.
3. Перебазировать полный диапазон `0c620cf..a45288c` командой `git rebase --onto migration/benct-base 0c620cf fix/modern-ha-compatibility`. При конфликтах README/card/tooling сохранять итоговое поведение `a45288c`; upstream-файлы из предыдущего пункта не удалять.
4. До любых GitHub cutover-операций доказать эквивалентность:
   - SHA-256 rebased `dist/xiaomi-vacuum-card.js` совпадает с исходным значением;
   - `git diff --name-status a45288c HEAD` показывает только добавленные benct-исторические файлы (`LICENSE`, `CHANGELOG.md`, `examples/**`, `img/**`, `tracker.json`), но не изменение существующих файлов;
   - `git merge-base --is-ancestor 44d53f… HEAD` завершается успешно;
   - `npm ci`, `npm run check` и существующий Home Assistant smoke проходят.
5. После доказательства переименовать rebased branch в локальный `main`. Старые локальные `main`/backup refs удалять только после успешной проверки bundle и архивных GitHub refs.

### 3. Выполнить безопасный GitHub cutover на прямой fork benct

1. Закрыть draft PR `3ative/lovelace-xiaomi-vacuum-card#2` с комментарием, что разработка перенесена в maintained direct fork; не оставлять активных PR или remotes, предполагающих дальнейшую интеграцию с 3ative.
2. Переименовать текущий GitHub-репозиторий в `Zuz666/lovelace-xiaomi-vacuum-card-3ative-archive`, затем включить `archived=true`. Если имя занято, использовать заранее определённый fallback `lovelace-xiaomi-vacuum-card-3ative-archive-20260817`; архив не удалять.
3. Освободив исходное имя, выполнить `gh repo fork benct/lovelace-xiaomi-vacuum-card --clone=false` под аккаунтом `Zuz666`. Это обязательно должен быть настоящий GitHub fork с direct parent `benct/lovelace-xiaomi-vacuum-card`, а не standalone import.
4. Перенастроить локальные remotes без двусмысленных URL:
   - старый `origin` сначала назвать `legacy-3ative` и направить на новое archive-name;
   - новый `origin` направить на `git@github.com:Zuz666/lovelace-xiaomi-vacuum-card.git`;
   - оставить `upstream` только на benct;
   - после проверки archive refs удалить локальный `legacy-3ative`; не добавлять `3ative` или `mydevenv` remotes.
5. Опубликовать rebased `main` обычным push без force, переключить GitHub default branch с унаследованного `master` на `main`, затем удалить только собственную remote-ветку `master`; `upstream/master` остаётся исторической точкой сравнения.
6. Настроить новый repo как maintained HACS project: включить Issues, задать описание `Maintained Xiaomi Vacuum Card for modern Home Assistant`, сохранить релевантные upstream topics и добавить `hacs`, `home-assistant`, `lovelace`, `xiaomi-vacuum`. После первого успешного CI включить branch protection для `main`: изменения только через PR и required checks `checks`, `ha-smoke`, `validate-hacs`; обязательный внешний approval не требовать, пока у проекта один maintainer.

### 4. Сделать проект единственным местом разработки и сохранить план в Git

В отдельной ветке `chore/mainline-infrastructure` выполнить небольшие commits, каждый с проходящим `npm run check`:

1. `chore: keep development artifacts in this repository`:
   - добавить `/.local/` в `.gitignore` как место для contributor-private notes, transcripts, scratch и backups внутри checkout;
   - прекратить игнорировать `AGENTS.md` и публичный `docs/`;
   - существующие raw `docs/sessions`, старые task/plan files и session logs не индексировать: они содержат устаревшие 3ative/mydevenv решения и credential-bearing material; переместить их без удаления в `.local/legacy-docs/` перед открытием `docs/` для Git;
   - оставить `/tmp/`, generated reports, dependencies и `.ha-smoke/` ignored.
2. `docs: define maintained mainline workflow`:
   - переписать tracked root `AGENTS.md` по образцу tracked root instructions в `ha-core`/`orca`, но без отдельной knowledge-system: назначение HACS plugin, direct-loaded canonical `dist/xiaomi-vacuum-card.js`, Lit из HA globals, точные Node 22/npm команды, обязательные behavior/smoke checks, main/feature-branch workflow, public `docs/` против private `.local/`, запрет secrets;
   - удалить устаревшее требование native `<select>` и документировать фактический dependency-free ARIA combobox (`button`/`listbox`) как поддерживаемую modern-HA реализацию;
   - переписать `DEVELOPMENT.md`: `Zuz666/...` — собственный mainline и release source, `benct/...` — только historical upstream, одна ветка `main`, feature PRs в `main`, без `release`, 3ative и mydevenv;
   - согласовать `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `TESTING.md` и README с теми же командами и политикой. README должен содержать полный Custom Repository URL и не обещать HACS Default registration.
3. `docs: preserve migration and compatibility decisions`:
   - скопировать утверждённый canonical plan verbatim в `docs/plans/2026-08-17-benct-mainline-hacs-migration.md`;
   - создать sanitised public spec `docs/specs/ha-2026-8-battery-compatibility.md` из `docs/tasks/task5.md`, сохранив ссылки/требования батареи, но исправив ложное утверждение о native dropdown и удалив session-specific данные;
   - не публиковать остальные raw legacy docs; новые планы/specs публикуются в `docs/` только по решению контрибьютора, private материал остаётся в `.local/`.
4. `chore: remove obsolete tracker metadata`: удалить унаследованный benct `tracker.json`; HACS contract остаётся `hacs.json` + `dist/xiaomi-vacuum-card.js` + release asset `xiaomi-vacuum-card.js`.

Слить эту ветку в `main` до начала behavioral fixes.

### 5. Привести CI, HACS validation и release workflow к mainline-модели

Продолжить `chore/mainline-infrastructure` независимыми commits до его merge:

1. `ci: validate mainline changes`:
   - в `.github/workflows/ci.yml` запускать pull-request jobs только для base `main`, push jobs только для `main`;
   - сохранить Node 22 `npm ci`, `npm run check` и реальный Docker Home Assistant + Playwright smoke; не создавать второй build/source pipeline.
2. `ci: validate the HACS plugin contract`:
   - добавить `.github/workflows/validate.yml` с official `hacs/action@main`, `category: plugin`, событиями `pull_request` для `main`, `push` в `main`, `workflow_dispatch` и weekly schedule;
   - использовать `permissions: {}` и job id/name `validate-hacs`, чтобы его можно было сделать required check;
   - перед включением branch protection убедиться, что repository description, Issues, topics, README, `hacs.json` и `dist/xiaomi-vacuum-card.js` проходят action без ignored checks.
3. `ci: release HACS assets from main`:
   - в `.github/workflows/release.yml` заменить несуществующую ветку `release` на строгую проверку `github.ref_type == branch && github.ref_name == main`;
   - сохранить semver/package/banner validation и `npm run check`;
   - копировать `dist/xiaomi-vacuum-card.js` в root staging asset `xiaomi-vacuum-card.js`;
   - создавать GitHub release и tag `v${RELEASE_VERSION}` через `gh release create … --target "$GITHUB_SHA"`, чтобы tag указывал на проверенный main commit, а asset имел имя из `hacs.json`;
   - не создавать внешний PR в `hacs/default`: утверждённая область публикации — HACS Custom Repository, полностью управляемый данным проектом.

### 6. Исправить полный click-path dynamic `service_data_template`

После merge инфраструктуры создать `fix/template-service-data` и одним working commit `fix: execute dynamic service templates` изменить код вместе с behavioral tests:

1. В `XiaomiVacuumCard.renderButton(data)` выбирать payload строго по сохранённому editor mode: при `data.service_data_mode === 'dynamic'` передавать `data.service_data_template`, иначе `data.service_data`. Это соединяет `buttonRowToConfig()` с click handler и устраняет silent fallback на один `entity_id`.
2. Добавить в `XiaomiVacuumCard` helper `renderTemplateOnce(template)`, потому что эквивалента в single-file card нет. Он должен:
   - вызвать `this._hass.connection.subscribeMessage(callback, {type: 'render_template', template, report_errors: true}, {resubscribe: false})`; `callWS()` для этого command запрещён, поскольку HA Core сначала отправляет empty result acknowledgement, а затем event `{result, listeners}`;
   - принять только первый event, отклонить event с `error`, и вызвать returned unsubscribe ровно один раз;
   - корректно обработать гонку, когда callback приходит до разрешения Promise с unsubscribe: отметить pending cleanup и выполнить его сразу после получения функции;
   - rejection исходной subscription Promise завершает template path без service call; rejection самого unsubscribe только логируется как cleanup error и не отменяет уже полученный результат;
   - не resubscribe после reconnect и не допускать повторного service call от последующих events.
3. В `callService(service, data)` для string payload дождаться `renderTemplateOnce`, распарсить event `result` как JSON и принять только non-null plain object (не array). Всегда перезаписать `entity_id` текущим vacuum entity. При subscription error, template error, malformed JSON/null/array залогировать существующий префикс `[xiaomi-vacuum-card]` и не вызывать HA service.
4. Расширить `tests/helpers/card-harness.mjs` protocol-faithful `hass.connection.subscribeMessage` fake: запись message/options, контролируемый event, Promise-returned unsubscribe и счётчик unsubscribe. `callWS` оставить только для request/response commands вроде `media_source/resolve_media`; mock, который возвращает строку из `callWS`, не считается допустимым тестом template feature.
5. В `tests/card-services.test.mjs` добавить editor-to-click test: editor сериализует custom dynamic button, card принимает полученный config, test извлекает реальный `@click` binding из `renderButton`, event возвращает JSON, и observable `hass.callService` получает parsed fields плюс принудительный current `entity_id`. Отдельно проверить synchronous-event-before-unsubscribe-Promise race, один unsubscribe, отсутствие `callWS`, а также отсутствие service call для event error, malformed JSON, null и array.

### 7. Исправить батарею для Home Assistant 2026.8 без регрессии старых интеграций

Создать следующую ветку от исправленного `main` либо второй commit в той же fix PR только после прохождения template tests; commit `fix: resolve modern vacuum battery sensors` включает код и его tests:

1. Вынести из `renderAttribute(data)` helper `resolveAttributeSource(data)`, возвращающий raw value и внешний entity state для иконки. Для battery rows (`row id battery` либо key `battery_level`/`battery`) использовать точный приоритет:
   1. явно настроенный `data.entity`, если такая entity существует; отсутствующий explicit entity не блокирует последующие fallback;
   2. `sensor.<vacuum_object_id>_battery`;
   3. legacy `sensor.<vacuum_object_id>_battery_level`;
   4. `vacuum.attributes.battery_level`;
   5. `vacuum.attributes.battery`;
   6. существующий generic `stateObj[data.key]` fallback.
   Для не-battery rows сохранить текущий порядок explicit entity → `${sensorEntity}_${data.key}` → vacuum attribute → vacuum property. Значения `0` и пустая строка должны считаться найденными, если свойство существует; missing source возвращает `null` и UI показывает локализованный Unavailable.
2. Передавать найденный source в `renderIcon(data, source)`. Для battery icon применять приоритет: icon внешнего sensor entity → deterministic numeric icon → legacy `vacuum.attributes.battery_icon` → configured fallback. Numeric mapping: clamp `0..100`, round к ближайшим 10; `0` даёт `mdi:battery-outline`, `100` — `mdi:battery`, промежуточные — `mdi:battery-10` … `mdi:battery-90`. Для не-battery rows сохранить прежнюю семантику configured/entity icon.
3. В `XiaomiVacuumCardEditor.entityDataRowSchema(row)` для battery row всегда показывать icon selector и ограничивать entity selector `{domain: 'sensor', device_class: 'battery'}`. Не записывать автоматически derived sensor entity в YAML/config: runtime resolution остаётся fallback и не загрязняет пользовательскую конфигурацию.
4. Добавить новый behavior file `tests/card-attributes.test.mjs`, поскольку такого покрытия нет. Матрица должна проверять каждый источник и его precedence, `0%`, Unavailable, icon precedence/numeric buckets, а также editor selector и отсутствие auto-saved derived entity.
5. В Home Assistant smoke fixture добавить template battery sensor с точным entity id `sensor.demo_vacuum_0_ground_floor_battery`, state `73`, `device_class: battery`, `%`; dashboard оставлять без explicit battery override. Playwright assertion должен увидеть `73%`, доказывая default modern sensor discovery в реальном HA, а не только VM.

### 8. Выпустить и проверить HACS Custom Repository `v4.6.0`

1. После merge обеих fix-веток убедиться, что `package.json` и banner уже равны `4.6.0`; не делать искусственный version bump, так как новый direct fork имеет upstream tags только до `v4.5.0` и `v4.6.0` ещё не выпускался.
2. Дождаться required checks на `main`, затем запустить `release.yml` вручную с input `version=4.6.0`. Release notes генерировать из истории после upstream `v4.5.0`; asset обязан называться `xiaomi-vacuum-card.js`.
3. Скачать опубликованный asset в `.local/release-check/v4.6.0/`, сравнить checksum/bytes с `dist/xiaomi-vacuum-card.js`, затем повторно прогнать smoke, подставив скачанный asset вместо working-tree файла.
4. Повторно запустить HACS validation после появления release, чтобы action проверил latest release, а не только default branch.
5. В disposable Home Assistant с установленным HACS добавить `https://github.com/Zuz666/lovelace-xiaomi-vacuum-card` как Custom repository категории Dashboard, установить `v4.6.0`, перезагрузить browser resource и проверить: card registration, default `73%` battery, fan-speed combobox и dynamic button template click без console errors. На этом публикация завершена; внешний `hacs/default` PR не создавать.

## Critical files & anchors

- `dist/xiaomi-vacuum-card.js` — `renderAttribute`, `renderIcon`, `renderButton`, `callService`, новый `resolveAttributeSource` и `renderTemplateOnce`; единственный shipped implementation.
- `tests/helpers/card-harness.mjs` — `createHass()` должен различать request/response `callWS` и subscription events, иначе template test даст false positive.
- `tests/card-services.test.mjs` — реальный editor → config → rendered click → subscription event → service-call contract.
- `.github/workflows/release.yml` — main-only release, exact HACS asset и tag target.
- `tests/ha-smoke/home-assistant/configuration.yaml` — реальный HA 2026.8-style battery sensor, подтверждающий runtime discovery.

## Verification

1. **Lineage и ветки**
   - `git merge-base --is-ancestor 44d53f9758c65449389b6d2cb8709321aefc7290 main` → exit 0.
   - `sha256sum dist/xiaomi-vacuum-card.js` сразу после rebase → исходный `329b…bfc` до behavioral fixes.
   - `git remote -v` → только `origin` (Zuz666 direct fork) и `upstream` (benct); новый GitHub repo сообщает `isFork=true`, parent `benct/lovelace-xiaomi-vacuum-card`, default `main`.
   - Archive repo содержит перечисленные archive branches/tag и имеет `archived=true`; новый repo их не содержит.
2. **Локальные проверки** из repository root после `npm ci`:
   - `npm run check`;
   - `node --test tests/card-services.test.mjs tests/card-attributes.test.mjs`;
   - template test ожидает subscription message `{type:'render_template', template:<exact>, report_errors:true}`, options `{resubscribe:false}`, один unsubscribe, `calls.ws=[]`, один service call с parsed data/current entity;
   - battery test с modern и legacy sources ожидает exact precedence и `73%`/numeric icon behavior.
3. **Реальный HA smoke**: подготовить `.ha-smoke` по `TESTING.md`, запустить `ghcr.io/home-assistant/home-assistant:stable`, затем `npm run test:ha-smoke`. Ожидаются rendered `Smoke Vacuum`, `73%`, отсутствие `not available`, `pageerror` и console errors.
4. **CI/HACS**: PR в `main` должен иметь зелёные `checks`, `ha-smoke`, `validate-hacs`; release workflow не запускается с feature branch и принимает `main`.
5. **Release artifact**:
   - `gh release view v4.6.0 --repo Zuz666/lovelace-xiaomi-vacuum-card` показывает published release на проверенном main SHA;
   - `gh release download v4.6.0 --pattern xiaomi-vacuum-card.js --dir .local/release-check/v4.6.0` и `cmp dist/xiaomi-vacuum-card.js .local/release-check/v4.6.0/xiaomi-vacuum-card.js` → равны;
   - повторный HACS action зелёный, ручная Custom Repository install отдаёт этот asset через `/hacsfiles/lovelace-xiaomi-vacuum-card/xiaomi-vacuum-card.js`.

## Assumptions & contingencies

- Публикация ограничена выбранным вариантом HACS Custom Repository; принятие во внешний `hacs/default` не является критерием готовности.
- Миграция намеренно закреплена на benct `v4.5.0`/`44d53f…`, даже если `upstream/master` сдвинется до исполнения: новые неизвестные upstream commits не включать в `v4.6.0`.
- Если текущий HEAD перед исполнением является потомком `a45288c`, расширить rebase range до нового tip и сначала записать новый checksum/count; если он не потомок, выполнить этот план от сохранённого `a45288c`, а новые refs сохранить в archive/bundle без автоматического cherry-pick.
- Если GitHub ещё не освободил исходное имя после rename, повторить fork после propagation; архив не удалять. Если основной archive-name занят, использовать зафиксированный suffix `-20260817`.
- Если любой pre-release check не проходит, release workflow не запускать. Если проверка скачанного asset после публикации расходится с `dist`, немедленно перевести GitHub release в draft и не считать HACS публикацию завершённой до пересоздания корректного asset на том же проверенном main commit.
