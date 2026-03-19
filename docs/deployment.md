# Деплой

## Требования

- Docker + Docker Compose
- PostgreSQL 16 (на хосте или в контейнере)
- Nginx (в составе общей инфраструктуры, например shifu)
- Внешняя сеть Docker `infra-network`

## Структура

```
infra/
  Dockerfile                  # Многоступенчатая сборка (node + rust + runtime)
  docker-compose.prod.yml     # Продакшен compose
  configuration.example.toml  # Пример конфига
  entrypoint.sh               # Миграции + запуск сервера

/opt/effecty/
  configuration.toml          # Продакшен конфиг (создаётся вручную на сервере)
```

## Пошаговая инструкция

### 1. Подготовка базы данных

```sql
CREATE USER effecty WITH PASSWORD 'надёжный-пароль';
CREATE DATABASE effecty OWNER effecty;
```

### 2. Создание Docker-сети (если ещё нет)

Effecty подключается к общей внешней сети `infra-network`.
Если она ещё не создана:

```bash
docker network create infra-network
```

### 3. Создание конфига

На сервере создать директорию и файл конфигурации:

```bash
sudo mkdir -p /etc/effecty
sudo cp infra/configuration.example.toml /opt/effecty/configuration.toml
sudo chmod 600 /opt/effecty/configuration.toml
```

Отредактировать `/opt/effecty/configuration.toml`:

```toml
[server]
host = "0.0.0.0"
port = 8010

[database]
url = "postgres://effecty:надёжный-пароль@host.docker.internal:5432/effecty"
max_connections = 10

[auth]
registration_enabled = false
jwt_secret = "сгенерировать: openssl rand -base64 32"
jwt_expiration_hours = 24

[app]
environment = "prod"

[storage]
upload_dir = "uploads"
```

### 4. Сборка и запуск

```bash
cd infra
docker compose -f docker-compose.prod.yml up -d --build
```

Что происходит при запуске:
1. **Сборка фронтенда** — `node:22-alpine`, `npm ci && npm run build`
2. **Сборка бэкенда** — `rust:latest`, `cargo build --release`
3. **Runtime** — `debian:bookworm-slim`, миграции (`cli migrate`), затем сервер

### 5. Создание пользователя

Регистрация отключена. Для создания первого пользователя:

```bash
# Временно изменить в configuration.toml: environment = "dev"
docker compose -f docker-compose.prod.yml restart server
docker exec effecty-server /app/bin/cli seed
# Вернуть: environment = "prod"
docker compose -f docker-compose.prod.yml restart server
```

Данные dev-пользователя: `nydevel@effecty.org` / `dev123`

### 6. Настройка Nginx

Effecty слушает на порте 8010 внутри сети `infra-network`.
В nginx-конфиге (например, в общем nginx shifu):

```nginx
# HTTP -> HTTPS
server {
    listen 80;
    server_name effecty.org www.effecty.org;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl;
    http2 on;
    server_name effecty.org www.effecty.org;

    ssl_certificate /etc/letsencrypt/live/effecty.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/effecty.org/privkey.pem;

    location / {
        proxy_pass http://effecty-server:8010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7. SSL-сертификат (первый раз)

```bash
certbot certonly --webroot -w /var/www/certbot \
  -d effecty.org -d www.effecty.org
```

После получения сертификата — перезапустить nginx.

## Обновление

```bash
cd infra
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Миграции применяются автоматически при каждом старте контейнера.

## Конфигурация

Вся конфигурация через файл `configuration.toml`:

| Параметр | Описание |
|---|---|
| `server.host` | Bind адрес (в Docker: `0.0.0.0`) |
| `server.port` | Порт сервера (`8010`) |
| `database.url` | PostgreSQL connection string |
| `database.max_connections` | Размер пула соединений |
| `auth.jwt_secret` | Секрет для JWT-токенов |
| `auth.jwt_expiration_hours` | Время жизни токена (часы) |
| `auth.registration_enabled` | Открытая регистрация (`false`) |
| `app.environment` | `dev` / `prod` / `test` |
| `storage.upload_dir` | Директория загрузок |

## Логи

```bash
docker logs -f effecty-server
```

## Volumes

- `effecty-uploads` — загруженные файлы (персистентный)
- `configuration.toml` — монтируется read-only из `/opt/effecty/`
