# Деплой

## Способ 1: .deb пакет (основной)

### Требования

- Rust (stable) + `cargo-deb` (`cargo install cargo-deb`)
- Node.js 18+ (для сборки фронтенда)
- SSH-доступ к серверу
- Целевой сервер: Debian/Ubuntu

### Деплой

```bash
effecty-cli deploy root@your-server
```

Что происходит:
1. Сборка фронтенда (`npm ci` + `npm run build`)
2. Сборка release-бинарников (`cargo build --release -p server -p cli`)
3. Создание .deb пакета (`cargo deb -p server --no-build`)
4. Загрузка на сервер (`scp`)
5. Установка (`dpkg --force-confold -i`) + перезапуск сервиса
6. Проверка (`systemctl is-active effecty`)

### Что устанавливается

| Компонент | Путь |
|-----------|------|
| Сервер | `/usr/bin/effecty` |
| CLI | `/usr/bin/effecty-cli` |
| Конфиг | `/etc/effecty/configuration.toml` |
| Фронтенд | `/usr/share/effecty/frontend/` |
| БД | `/var/lib/effecty/effecty.db` |
| Загрузки | `/var/lib/effecty/uploads/` |
| systemd | `effecty.service` |

Сервис работает на порту **8400** от непривилегированного пользователя `effecty`.

### После первого деплоя

```bash
sudo nano /etc/effecty/configuration.toml   # задать jwt_secret
sudo systemctl restart effecty
effecty-cli -r root@server create-user admin
sudo systemctl enable effecty                # автозапуск при загрузке
```

### Удалённые команды

CLI поддерживает выполнение команд на сервере через SSH:

```bash
effecty-cli -r root@server create-user admin
# эквивалентно: ssh -t root@server "effecty-cli --config /etc/effecty/configuration.toml create-user admin"
```

Флаг `-t` обеспечивает TTY для интерактивного ввода пароля.

### Обновление

```bash
effecty-cli deploy root@your-server
```

Миграции применяются автоматически при каждом старте сервера. Конфиг на сервере не перезаписывается (`--force-confold`).

---

## Конфигурация

Вся конфигурация через файл `configuration.toml`:

| Параметр | Описание |
|---|---|
| `server.host` | Bind адрес |
| `server.port` | Порт сервера |
| `database.url` | SQLite connection string |
| `database.max_connections` | Размер пула соединений |
| `auth.jwt_secret` | Секрет для JWT-токенов |
| `auth.jwt_expiration_hours` | Время жизни токена (часы) |
| `auth.registration_enabled` | Открытая регистрация (`false`) |
| `app.environment` | `dev` / `prod` / `test` |
| `storage.upload_dir` | Директория загрузок |
