# effecty.org

Personal productivity platform. Notes, tasks, calendar, workouts, thoughts, and learning materials in one place.

## Stack

- **Backend**: Rust (Axum, sqlx, SQLite)
- **Frontend**: React 18, TypeScript, Vite

## Quick start

```bash
# Install dependencies and build frontend
cd frontend && npm ci && npm run build && cd ..

# Run migrations and create dev user
cargo run -p cli -- migrate
cargo run -p cli -- seed

# Start the server
cargo run -p cli -- dev
```

## Development

```bash
cargo build                    # build backend
cargo test                     # run tests
cargo clippy --workspace       # lint
cargo fmt --all -- --check     # check formatting
cd frontend && npm run dev     # frontend dev server
```

## License

This project is licensed under the [GNU General Public License v2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html).
