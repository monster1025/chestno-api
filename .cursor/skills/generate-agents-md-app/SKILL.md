---
description: "Регенерация group-level AGENTS.md"
---

# /generate-agents-md-app — Обновить AGENTS.md группы

Вызывает `ml-agent-generate-agents-md-app` для регенерации managed-секций (`<!-- managed:service-index -->`) в `backend/AGENTS.md`, `frontend/AGENTS.md`, `libs/AGENTS.md`, `infrastructure/AGENTS.md`.

## Процесс

1. Определить группу (путь в workspace)
2. Сканировать клонированные сервисы группы и `repos.yml`
3. Перегенерировать managed-секцию в `<group>/AGENTS.md`
