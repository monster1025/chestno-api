# chestno-api — Тестовое web-приложение для API Честного знака

Веб-приложение для проверки кодов маркировки через API ГИС МТ «Честный знак» (True API).

## Архитектура

- **Backend**: Fastify + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Docker**: docker-compose (2 сервиса: backend, frontend)

## Быстрый старт

```bash
# Клонировать и перейти в директорию
cd chestno-api

# Настроить окружение
cp backend/.env.example backend/.env
# Отредактировать backend/.env — указать thumbprint сертификата

# Запустить
docker-compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## Разработка (без Docker)

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (в отдельном терминале)
cd frontend
npm install
npm run dev
```

## Структура проекта

```
backend/
  src/
    config.ts           # Конфигурация
    index.ts            # Точка входа Fastify
    routes/
      auth.ts           # GET /auth/key, POST /auth/signin, GET /auth/status
      cises.ts          # POST /api/check-codes/public, /api/check-codes/auth
      upd.ts            # POST /api/upload-upd
    services/
      auth-service.ts   # True API аутентификация + подпись через КриптоПро
      cises-service.ts  # Проверка КМ (публичная / авторизованная)
      token-cache.ts    # Кеширование токена (node-cache, TTL 10ч)
      upd-parser.ts     # Парсинг XML УПД (формат Приказа №970)
    types/
      index.ts          # TypeScript типы

frontend/
  src/
    App.tsx             # Корневой компонент с навигацией
    pages/
      AuthPage.tsx      # Авторизация
      CheckCodesPage.tsx# Проверка кодов
      UploadUpdPage.tsx # Загрузка УПД
    components/
      ResultsTable.tsx  # Таблица результатов с цветовой индикацией
    services/
      api.ts            # HTTP-клиент к backend
    types/
      index.ts          # TypeScript типы
```

## API Endpoints

### Аутентификация
- `GET /auth/key` — получение UUID + data для подписи
- `POST /auth/signin` — отправка подписи, получение токена
- `GET /auth/status` — статус авторизации

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
| `CERT_THUMBPRINT` | Thumbprint сертификата КриптоПро | — |

## Подпись данных через КриптоПро

Подпись выполняется через CLI-утилиту `cryptcp` (входит в состав КриптоПро CSP). Установите КриптоПро CSP и укажите thumbprint сертификата в `CERT_THUMBPRINT`.

### Получение thumbprint сертификата

```bash
cryptcp -list
```
