---
description: "Принципы написания кода"
---

# /coding-principles — Принципы кода

## Общие

- Минимальный scope изменений — только то, что нужно для задачи
- Следовать существующим конвенциям и стилю кода
- Комментарии — только когда WHY неочевидно
- Не редактировать сгенерированный код (NSwag, EF migrations snapshot)

## C# / .NET

- Nullable reference types включены
- Слои: `Instance` → `BusinessLogic` → `Database` → `Models`/`Core`
- Acceptance tests в отдельных проектах

## TypeScript / React

- Без `any` — строгая типизация
- Компоненты в `src/components/`, API-клиенты в `src/api/`
- SCSS modules
