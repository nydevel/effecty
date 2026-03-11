# Архитектура

## Общая структура

```
effecty.org/
├── crates/
│   ├── core/      — конфиг, типы, доменная логика (без IO/async)
│   ├── db/        — sqlx PgPool, миграции, репозитории
│   ├── server/    — axum HTTP-сервер, роуты, auth middleware
│   └── cli/       — CLI утилиты
├── migrations/    — SQL-миграции sqlx
├── frontend/      — React/Vite/TypeScript SPA
├── infra/         — Docker-файлы
└── docs/          — документация
```

## Backend

- **Rust** с workspace (Cargo)
- **Axum** — HTTP-фреймворк
- **sqlx** — async PostgreSQL, compile-time checked queries
- **JWT** авторизация (jsonwebtoken + argon2 для паролей)
- **tracing** — структурное логирование

## Frontend

- **React 18 + TypeScript** через Vite
- **BlockNote** — Notion-style WYSIWYG блочный редактор
- **react-arborist** — дерево файлов/папок с drag-and-drop

## База данных

- **PostgreSQL 16**
- Дерево заметок: Adjacency List (`parent_id`) + `WITH RECURSIVE` CTE
- Порядок элементов: `sort_order DOUBLE PRECISION`

## Конфигурация

Файл `configuration.toml` в корне проекта. Пример: `configuration.example.toml`.

Секции: `[server]`, `[database]`, `[auth]`, `[app]`.

Режимы (`app.environment`): `dev`, `prod`, `test`.

## API

Все API-эндпоинты под `/api/`:

- `POST /api/auth/login` — авторизация
- `POST /api/auth/register` — регистрация (если включена в конфиге)
- `GET /api/auth/me` — текущий пользователь
- `GET /api/notes` — дерево заметок
- `POST /api/notes` — создать заметку/папку
- `GET /api/notes/:id` — получить заметку
- `PUT /api/notes/:id` — обновить заметку
- `PATCH /api/notes/:id/move` — переместить (drag-and-drop)
- `DELETE /api/notes/:id` — удалить
- `GET /health` — healthcheck

Swagger UI: `/swagger-ui` (только в dev, при сборке с `--features openapi`).
