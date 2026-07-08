# chestno-api — Тестовое web-приложение для API Честного знака

Веб-приложение для проверки кодов маркировки через API ГИС МТ «Честный знак» (True API).

## Архитектура

- **Backend**: Fastify + TypeScript (прокси-сервер к True API)
- **Frontend**: React + Vite + TypeScript (SPA с интеграцией КриптоПро Browser Plugin)
- **Docker**: docker-compose (2 сервиса: backend, frontend)

## Быстрый старт

```bash
cd chestno-api
docker-compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## Разработка (без Docker)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (в отдельном терминале)
cd frontend && npm install && npm run dev
```

## Структура проекта

```
backend/
  src/
    config.ts           # Конфигурация
    index.ts            # Точка входа Fastify
    routes/auth.ts      # GET /auth/key, POST /auth/simpleSignIn, GET /auth/status, POST /auth/logout
    routes/cises.ts     # POST /api/check-codes/public, POST /api/check-codes/auth
    routes/upd.ts       # POST /api/upload-upd
    services/auth-service.ts   # Прокси к True API auth
    services/cises-service.ts  # Проверка КМ (публичная / авторизованная)
    services/token-cache.ts    # Кеширование токена (node-cache, TTL 10ч)
    services/upd-parser.ts     # Парсинг XML УПД (формат Приказа №970)
    types/index.ts

frontend/
  src/
    App.tsx
    pages/AuthPage.tsx         # Авторизация через КриптоПро Browser Plugin
    pages/CheckCodesPage.tsx   # Проверка кодов
    pages/UploadUpdPage.tsx    # Загрузка УПД
    components/ResultsTable.tsx
    services/api.ts            # HTTP-клиент
    services/cadesplugin.ts    # Интеграция с КриптоПро Browser Plugin
    types/index.ts
```

## API Endpoints

### Аутентификация
- `GET /auth/key` — получение UUID + data для подписи
- `POST /auth/simpleSignIn` — отправка подписи, получение токена
- `GET /auth/status` — статус авторизации
- `POST /auth/logout` — сброс токена

### Проверка кодов
- `POST /api/check-codes/public` — публичная проверка (без авторизации)
- `POST /api/check-codes/auth` — авторизованная проверка (полная информация)

### УПД
- `POST /api/upload-upd` — загрузка XML УПД, парсинг и проверка кодов

## Переменные окружения (backend/.env)

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `PORT` | Порт сервера | `3001` |
| `HOST` | Хост | `0.0.0.0` |
| `TRUE_API_URL` | URL True API | `https://markirovka.sandbox.crptech.ru/api/v3/true-api` |
| `PUBLIC_CHECK_URL` | URL публичного API | `https://mobile.api.crpt.ru/mobile/check` |

## Процесс авторизации

1. Пользователь нажимает «Подписать и войти» в браузере
2. Frontend получает UUID + data от `GET /auth/key`
3. КриптоПро Browser Plugin подписывает data (CAdES-BES, присоединённая подпись, base64)
4. Подпись отправляется на `POST /auth/simpleSignIn`
5. Backend проксирует запрос в True API, кеширует токен
6. Токен используется для авторизованных запросов (10 часов)

> Подпись выполняется **на стороне клиента** — закрытый ключ УКЭП не покидает устройство пользователя.
