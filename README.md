# effecty.org

Personal productivity platform. Notes, tasks, calendar, workouts, thoughts, and learning materials in one place.

## Stack

- **Backend**: Rust (Axum, sqlx, SQLite)
- **Frontend**: React, TypeScript, Vite

## Quick start

```bash
cp configuration.example.toml configuration.toml

# Build frontend and start server
cargo run -p dev

# Create a user
cargo run -p cli -- create-user admin
```

## Development

```bash
cargo run -p dev               # build frontend + start server
cargo build                    # build backend
cargo test                     # run tests
cargo clippy --workspace       # lint
cargo fmt --all -- --check     # check formatting
cargo run -p server            # run server only
cargo run -p server --features openapi  # run with swagger
cargo run -p cli -- create-user <login> # create user
cargo run -p cli -- deploy root@server  # deploy to remote
cd frontend && npm run dev     # frontend dev server
cd frontend && npm run build   # build frontend
```

## Binaries

The project produces three binaries:

| Binary | Crate | Shipped | Purpose |
|--------|-------|---------|---------|
| `effecty` | server | yes | HTTP server (migrations run automatically on start) |
| `effecty-cli` | cli | yes | User management and deployment |
| `effecty-dev` | dev | no | Development helper (builds frontend + starts server) |

### effecty (server)

```bash
effecty                              # start web server
effecty --config /path/to/config     # use custom config file
```

### effecty-cli

```bash
effecty-cli create-user <login>                    # create user (local)
effecty-cli -r root@server create-user <login>     # create user (remote via SSH)
effecty-cli deploy root@server                     # build, package, deploy
effecty-cli --config /path/to/config <command>     # use custom config file
```

### effecty-dev

```bash
effecty-dev    # build frontend (npm ci + npm run build) and start server
```

## Releases

Pushing a tag like `v0.1.0` triggers the GitHub Actions release workflow. It builds the frontend, compiles the `server` and `effecty-cli` binaries, creates `.deb` and `.rpm` packages, and attaches them to the GitHub Release.

## Deploy

Requires Docker. The deploy command auto-detects the remote server architecture (`amd64`/`arm64`) and cross-compiles via Docker.

```bash
effecty-cli deploy root@your-server
# or during development:
cargo run -p cli -- deploy root@your-server
```

This detects the remote architecture, builds a `.deb` package via Docker, uploads it with `rsync`, installs, and restarts the service. The frontend is embedded in the server binary.

### What gets installed

| Component | Path |
|-----------|------|
| Server binary (frontend embedded) | `/usr/bin/effecty` |
| CLI binary | `/usr/bin/effecty-cli` |
| Config | `/etc/effecty/configuration.toml` |
| Database | `/var/lib/effecty/effecty.db` |
| Uploads | `/var/lib/effecty/uploads/` |
| systemd unit | `effecty.service` |

Service runs on port **8400** as unprivileged user `effecty`.

### After first deploy

```bash
effecty-cli -r root@server create-user admin  # create first user
sudo systemctl enable effecty                  # autostart on boot
```

The `jwt_secret` is auto-generated on first deploy if it has the default placeholder value.

### Remote commands

The `--remote` / `-r` flag executes CLI commands on the remote server via SSH:

```bash
effecty-cli -r root@server create-user admin
# equivalent to: ssh -t root@server "effecty-cli --config /etc/effecty/configuration.toml create-user admin"
```

The `-t` flag ensures TTY forwarding for interactive password prompts.

## License

[GNU General Public License v2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html)
