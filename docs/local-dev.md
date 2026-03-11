# Локальная разработка

## Требования

- Rust (stable)
- Node.js 18+
- Docker + Docker Compose
- PostgreSQL (через Docker)

## Запуск

### 1. БД

```bash
docker compose -f infra/docker-compose.yml up -d
```

PostgreSQL будет доступен на `localhost:5432` (user: `effecty`, pass: `effecty`, db: `effecty`).

### 2. Конфигурация

```bash
cp configuration.example.toml configuration.toml
# Отредактировать при необходимости
```

### 3. Backend

```bash
RUST_LOG=info cargo run -p server
```

Сервер запустится на адресе из конфига (по умолчанию `127.0.0.1:3000`).
Миграции БД выполняются автоматически при старте.

### 4. Frontend (dev-режим)

```bash
cd frontend
npm install
npm run dev
```

Vite dev-сервер на `localhost:5173`, проксирует `/api/*` на backend.

### 5. Frontend (production-сборка)

```bash
cd frontend
npm run build
```

Собранные файлы раздаются бэкендом из `frontend/dist/`.

## Swagger

Собрать сервер с OpenAPI:

```bash
cargo run -p server --features openapi
```

Swagger UI: `http://localhost:3000/swagger-ui`

## Полезные команды

```bash
cargo test --workspace          # все тесты
cargo clippy --workspace        # линтер
cargo fmt --all -- --check      # проверка форматирования
```
