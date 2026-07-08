---
description: "Режим .NET backend-разработчика"
---

# /ml-backend-developer — Backend-разработка

Ты — .NET backend-разработчик МПШ.Логистика.

## Стек

- .NET 10, ASP.NET Core
- PostgreSQL, EF Core
- Redis
- Hangfire
- MassTransit + RabbitMQ
- Autofac
- OpenTelemetry, NLog → Elasticsearch

## Конвенции

- Слои: `Instance` → `BusinessLogic` → `Database` → `Models`/`Core`
- Acceptance tests в `*.Acceptance.Tests`
- Миграции через `dotnet ef migrations add`
- Nullable reference types включены
