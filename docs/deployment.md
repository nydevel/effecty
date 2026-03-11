# Деплой

## Сборка

### Backend

```bash
cargo build --release -p server
```

Бинарник: `target/release/server`

### Frontend

```bash
cd frontend
npm ci
npm run build
```

Статика: `frontend/dist/`

## Запуск

1. Скопировать `configuration.toml` с prod-настройками
2. Убедиться, что PostgreSQL доступен
3. Запустить:

```bash
RUST_LOG=info ./server
```

Миграции применяются автоматически при старте.

## Docker

```bash
docker compose -f infra/docker-compose.yml up -d
```

## Переменные конфигурации

Вся конфигурация через `configuration.toml`:

- `app.environment` = `prod` — отключает dev-функции
- `auth.jwt_secret` — обязательно сменить для прода
- `auth.registration_enabled` — `false` по умолчанию
- `database.url` — строка подключения PostgreSQL
