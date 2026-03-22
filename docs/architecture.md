# Архитектура

## Общая структура

```
effecty.org/
├── crates/
│   ├── core/       — конфиг, типы, доменная логика (без IO/async)
│   ├── db/         — sqlx SqlitePool, миграции (sea-orm-migration), репозитории
│   ├── migration/  — миграции БД (sea-orm-migration)
│   ├── server/     — axum HTTP-сервер, роуты, auth middleware
│   ├── cli/        — CLI: управление пользователями и деплой (поставляется в пакете)
│   ├── dev/        — dev-утилита: сборка фронта + запуск сервера (не поставляется)
│   ├── notes/      — модуль заметок
│   ├── tasks/      — модуль задач
│   ├── workouts/   — модуль тренировок
│   ├── profile/    — модуль профиля
│   ├── thoughts/   — модуль мыслей
│   ├── learning/   — модуль обучения (материалы + roadmap)
│   └── data-transfer/ — импорт/экспорт данных
├── frontend/       — React/Vite/TypeScript SPA
├── infra/          — Docker-файлы
├── packaging/      — systemd-юниты, скрипты для .deb/.rpm
└── docs/           — документация
```

## Бинарники

| Бинарник | Крейт | В поставке | Назначение |
|----------|-------|------------|------------|
| `effecty` | server | да | HTTP-сервер (миграции автоматически при старте) |
| `effecty-cli` | cli | да | Управление пользователями, деплой, удалённые команды через SSH |
| `effecty-dev` | dev | нет | Сборка фронта + запуск сервера (только для разработки) |

## Backend

- **Rust** с workspace (Cargo)
- **Axum** — HTTP-фреймворк
- **sqlx** — async SQLite
- **sea-orm-migration** — миграции БД (автоматически при старте сервера)
- **JWT** авторизация (jsonwebtoken + argon2 для паролей)
- **tracing** — структурное логирование

## Frontend

- **React + TypeScript** через Vite
- **BlockNote** — Notion-style WYSIWYG блочный редактор
- **react-arborist** — дерево файлов/папок с drag-and-drop
- **@xyflow/react** — интерактивный граф (roadmap)
- **Ant Design** — UI-компоненты

## База данных

- **SQLite**
- Дерево заметок: Adjacency List (`parent_id`) + `WITH RECURSIVE` CTE
- Порядок элементов: `sort_order DOUBLE PRECISION`

## Конфигурация

Файл `configuration.toml` в корне проекта. Пример: `configuration.example.toml`.

Секции: `[server]`, `[database]`, `[auth]`, `[app]`, `[storage]`.

Режимы (`app.environment`): `dev`, `prod`, `test`.

## API

Все API-эндпоинты под `/api/`:

- `POST /api/auth/login` — авторизация
- `GET /api/auth/me` — текущий пользователь
- `GET /api/notes` — дерево заметок
- `POST /api/notes` — создать заметку/папку
- `GET /api/notes/:id` — получить заметку
- `PUT /api/notes/:id` — обновить заметку
- `PATCH /api/notes/:id/move` — переместить (drag-and-drop)
- `DELETE /api/notes/:id` — удалить
- `GET/POST /api/tasks` — задачи
- `GET/POST /api/workouts` — тренировки
- `GET/POST /api/thoughts` — мысли
- `GET/POST /api/learning/materials` — учебные материалы
- `GET/POST /api/roadmap/nodes` — узлы roadmap
- `GET /health` — healthcheck

Swagger UI: `/swagger-ui` (при сборке с `--features openapi`).
