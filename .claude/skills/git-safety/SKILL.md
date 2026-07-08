---
name: git-safety
description: "Правила безопасности git"
---

# /git-safety — Безопасность git

- **Никогда** не пушить в `master`, `main`, `develop`
- Работать в `feature/MBL-<N>` или `hotfix/MBL-<N>`
- Git-команды выполнять в сервисном репозитории, не в корне workspace
- Проверять `git status` и `git diff` перед коммитом
- Не коммитить .env, credentials, secrets
- Использовать `.env.example` как шаблон для секретов
