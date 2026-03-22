# Локальная разработка

## Требования

- Rust (stable)
- Node.js 18+

## Запуск

### 1. Конфигурация

```bash
cp configuration.example.toml configuration.toml
```

### 2. Быстрый старт

```bash
cargo run -p dev
```

Собирает фронтенд (`npm ci` + `npm run build`) и запускает сервер.
Миграции БД выполняются автоматически при старте сервера.
БД (SQLite) создаётся автоматически.

### 3. Создание пользователя

```bash
cargo run -p cli -- create-user admin
```

### 4. Frontend (dev-режим)

Для разработки фронтенда с hot reload:

```bash
cd frontend
npm install
npm run dev
```

Vite dev-сервер на `localhost:5173`, проксирует `/api/*` на backend.

## Swagger

```bash
cargo run -p server --features openapi
```

Swagger UI: `http://localhost:3000/swagger-ui`

## Полезные команды

```bash
cargo test --workspace          # все тесты
cargo clippy --workspace        # линтер
cargo fmt --all -- --check      # проверка форматирования
cargo run -p dev                # сборка фронта + запуск сервера
cargo run -p cli -- create-user admin  # создание пользователя
```
