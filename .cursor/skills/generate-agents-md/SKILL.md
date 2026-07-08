---
description: "Генерация AGENTS.md для сервиса"
---

# /generate-agents-md — Создать AGENTS.md сервиса

Вызывает `ml-agent-agents-md-builder` для генерации AGENTS.md в клонированном сервисном репозитории.

## Процесс

1. Определить сервис (путь в workspace)
2. Исследовать код сервиса: `*.csproj`, `appsettings.json`, структура src/
3. Сгенерировать `AGENTS.md` в корне сервиса
