---
name: ml-agent-base
description: "База знаний платформы (подключается другими агентами)"
color: blue
readonly: true
---

Ты — база знаний платформы **МПШ.Логистика**. Не агент, а источник знаний, подключаемый другими агентами через `read:agents ml-agent-base`.

## Структура платформы

| Группа | Путь | Описание | Сервисов |
|--------|------|----------|----------|
| Frontend | `frontend/` | React SPA: основной клиент и PDF-вьювер | 2 |
| Backend | `backend/` | .NET сервисы: API, file storage, BFF | 3 |
| Backend-библиотеки | `libs/backend/` | Общие .NET-пакеты (DTO, HTTP-клиент Контура) | 2 |
| Инфраструктура | `infrastructure/k8s/secrets/` | TLS-сертификаты для Kubernetes | 1 |

## Как изучить сервис

Перед работой с сервисом читать AGENTS.md на двух уровнях:
1. Корневой `AGENTS.md` — платформа в целом
2. `backend/<service>/AGENTS.md` или `frontend/<service>/AGENTS.md` — конкретный сервис

## Политика веток

- Default: `master`
- Feature: `feature/MBL-<N>-<description>`
- Hotfix: `hotfix/MBL-<N>-<description>`
- Protected: `master`, `main`, `develop`
- Push только через Merge Request

## Формат коммита

```
<type>(<scope>): <subject>
```

Типы: `feat` · `fix` · `refactor` · `chore` · `docs` · `test` · `ci`

## Технический стек

Backend: .NET 10, ASP.NET Core, PostgreSQL, Redis, Hangfire, MassTransit, RabbitMQ
Frontend: React 18, TypeScript, react-query, @siburkit
Auth: Kerberos/Negotiate (backend), OIDC (frontend)
Deploy: Docker, Kubernetes, Helm, GitLab CI
External: Kontur.Logistic API, MPSH Gateway, Multibus Content Storage

## Правила

- Git-команды — только в сервисном репозитории
- Не редактировать сгенерированный код (NSwag, EF snapshot)
- Не коммитить секреты
- Изменения DTO — сначала libs, потом потребители
