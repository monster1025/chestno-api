---
description: "Формирование коммита по стандарту"
---

# /git-commit — Формат коммита

## Формат

```
<type>(<scope>): <subject>
```

## Типы

`feat` · `fix` · `refactor` · `test` · `docs` · `chore` · `build` · `ci`

## Scope

Имя сервиса: `api`, `filestorage`, `ui.facade`, `ui.client`, `pdf.viewer`

## Примеры

```
feat(api): add transportation status filter endpoint
fix(ui.client): correct date picker timezone
refactor(filestorage): extract content validation
```

## Процесс

1. Проверить `git status` и `git diff`
2. Сформировать коммит по формату
3. Не коммитить без явной просьбы пользователя
