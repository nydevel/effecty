# effecty.org

Personal productivity platform. Notes, tasks, calendar, workouts, thoughts, and learning materials in one place.

## Stack

- **Backend**: Rust (Axum, sqlx, SQLite)
- **Frontend**: React 18, TypeScript, Vite

## Quick start

```bash
cp configuration.example.toml configuration.toml

# Build frontend and start server
cargo run -p cli -- dev

# Create a user
cargo run -p server -- create-user admin@effecty.org
```

## Development

```bash
cargo build                    # build backend
cargo test                     # run tests
cargo clippy --workspace       # lint
cargo fmt --all -- --check     # check formatting
cd frontend && npm run dev     # frontend dev server
```

## Server commands

The `server` binary doubles as a CLI:

```bash
effecty                              # start web server (default)
effecty serve                        # start web server (explicit)
effecty migrate                      # run database migrations
effecty create-user <email>          # create a user (prompts for password)
effecty --config /path/to/config     # use custom config file
```

## Deploy

Requires `cargo-deb`: `cargo install cargo-deb`

```bash
cargo run -p cli -- deploy root@your-server
```

This builds the frontend, compiles a release binary, creates a `.deb` package, uploads it to the server, and restarts the service.

### What gets installed

| Component | Path |
|-----------|------|
| Binary | `/usr/bin/effecty` |
| Config | `/etc/effecty/configuration.toml` |
| Frontend | `/usr/share/effecty/frontend/` |
| Database | `/var/lib/effecty/effecty.db` |
| Uploads | `/var/lib/effecty/uploads/` |
| systemd unit | `effecty.service` |

Service runs on port **8400** as unprivileged user `effecty`.

### After first deploy

```bash
sudo nano /etc/effecty/configuration.toml   # set jwt_secret
sudo systemctl restart effecty
sudo effecty --config /etc/effecty/configuration.toml create-user admin@effecty.org
sudo systemctl enable effecty                # autostart on boot
```

## License

[GNU General Public License v2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html)
