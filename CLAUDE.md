# CLAUDE.md — effecty.org

## Project overview

Rust workspace project. Monorepo with multiple crates under `crates/`.

## Structure

```
crates/
  base/      — shared library (domain logic, types, utilities)
  cli/       — CLI binary
  server/    — server binary
```

## Build & test commands

```bash
cargo build                        # build all crates
cargo test                         # run all tests
cargo run -p cli                   # run CLI
cargo run -p server                # run server
cargo clippy --workspace           # lint
cargo fmt --all -- --check         # check formatting
```

## Conventions

- Rust 2021 edition
- Workspace dependencies: define shared deps in root `Cargo.toml` `[workspace.dependencies]`, reference via `.workspace = true`
- Error handling: use `anyhow::Result` for binaries, `thiserror` for library errors in core
- Async runtime: tokio
- Logging: `tracing` + `tracing-subscriber`
- Serialization: `serde` + `serde_json`
- Keep `base` free of IO and async — pure domain logic
- Tests go in `#[cfg(test)] mod tests` inside source files; integration tests in `tests/` dirs
- Run `cargo fmt --all` before committing
- Run `cargo clippy --workspace` and fix warnings before committing

## Code Style

1. Core principles

- Write clean, readable code with explicit intent.
- Follow SOLID principles and existing project design patterns; prefer composition over inheritance.
- Code should be self-documenting; use comments only for complex business logic and unsafe blocks.
- Always keep performance and allocations in mind in the context of cloud systems, but avoid premature optimization.
- Security over convenience: validate and sanitize all external input.

2. Scope and verbosity

- Implement exactly and only what is requested; no “nice to have” features or refactors without an explicit task.
- When something is unclear, choose the simplest valid interpretation and list potential improvements separately.
- For simple changes: 1–2 sentences describing what was done + the code.
- For complex changes: short overview, change list (File / What / Why), code with minimal comments, risks/TODO if any.

3. Architecture and design

- Study the existing architecture and conventions before you start changing code.
- New code must be consistent with existing modules, naming, layering, and error-handling patterns.
- Keep responsibilities separated, coupling low, cohesion high; define interfaces (traits) explicitly.
- Use dependency injection and traits for external services/DBs to keep code testable and replaceable.
- For UI: strictly use the existing design system and tokens, no custom colors/fonts/animations or new components unless requested.

4. Code quality

- Follow DRY but do not over-abstract; each function should do one thing and do it well.
- Keep functions short (~20–50 lines) with maximum nesting of 3–4 levels; use early returns/guard clauses instead of deep nesting.
- Use clear names: verbNoun for functions, meaningful nouns for variables; constants in SCREAMING_SNAKE_CASE.
- Avoid magic numbers; extract them into named constants with a short clarifying comment.

4.1 Error handling and tests

- Handle all meaningful error cases explicitly; do not silently swallow errors.
- Log with context: what failed, key identifiers, input data, trace IDs if available.
- Design code to be testable: prefer pure functions, use dependency injection for side-effectful components.
- Add unit tests for business logic and integration tests for API/DB/cloud interactions, including edge cases and error scenarios.

5. Rust-specific rules

5.1 Tooling and linting

- Always run cargo fmt before committing changes.
- Run cargo clippy regularly and fix all warnings (at least in the touched code).
- Run cargo check frequently during development; enable strict lint sets like clippy::all and clippy::pedantic when the project allows it.
- For production crates that do not need unsafe, use #![deny(unsafe_code)].
- Use the latest stable Rust edition configured in Cargo.toml.

5.2 Ownership, types, errors

- Prefer borrowing (&T, &mut T) over taking ownership; every .clone() must be justified.
- Avoid premature Arc<Mutex<T>>; start with simple references and only add shared mutable state when necessary.
- Function parameters should take &str and slices/&Vec where possible; return String/Vec<T> only when creating new data.
- Model domain concepts with strong types (newtype pattern for IDs, emails, amounts, etc.).
- Use Result<T, E> for all recoverable errors; restrict panic!/unwrap() to tests and truly impossible states.
- Use expect with meaningful messages when you are logically sure something cannot fail.
- In applications prefer anyhow/eyre; in libraries prefer thiserror and typed errors; propagate errors with the ? operator.

5.3 Idiomatic Rust

- Prefer iterator chains, if let / let else, and exhaustive match over ad-hoc control flow.
- Use builder pattern for complex construction and method chaining for fluent APIs where it stays readable.
- Implement standard traits (Debug, Display, Default, From/Into, Clone, PartialEq/Eq, etc.) where it makes sense.

5.4 Async and cloud

- Use Tokio as the default async runtime for backend/cloud services; pair it with frameworks like Axum/Actix for HTTP APIs.
- Never block the async runtime: avoid std::thread::sleep and blocking I/O in async code; use tokio::time::sleep and spawn_blocking instead.
- For concurrency, use tokio::spawn, tokio::join!, and tokio::select!; share state via Arc and async Mutex/RwLock.
- Use tokio::sync channels (mpsc, oneshot, broadcast, watch) for coordination between tasks.

6. Style and file structure

- Avoid deeply nested if statements; favor early returns, guard clauses, and helper functions or iterator combinators.
- Place all use imports at the top of the file, followed by const/static, struct/enum/trait declarations, then impl blocks and functions.
- Do not put business logic in lib.rs or mod.rs: keep them for module declarations, re-exports, and high-level wiring only.
- Place integration tests under the top-level tests/ directory; use #[cfg(test)] modules for small unit tests close to the code.

6.1 Loops and labels

- All loops (loop, while, for) must be explicitly labeled using a descriptive label name (e.g. 'main_loop:, 'retry:, 'scan:).
- Use labeled break/continue when exiting or skipping from nested loops to make control flow explicit.
- Do not use meaningless or underscore-style labels (like '_a); labels must follow Rust identifier rules and reflect intent.

7. Security

- Never commit secrets (API keys, passwords, tokens); use environment variables or the cloud provider’s secret store.
- Validate and sanitize all incoming data from APIs, queues, and files; enforce HTTPS/mTLS for all network communication.
- Implement rate limiting, brute-force protection, anomaly logging, and alerting at the application level.

8. Final verification

- Code compiles (cargo check), is formatted (cargo fmt), and passes cargo clippy without warnings on the changed parts.
- All explicit requirements are implemented; no unrequested features or refactors were introduced.
- Error handling and logging are in place and consistent; names of types, variables, and functions are clear.
- No hard-coded secrets, no commented-out dead code, and no violations of the project’s established style and architecture.
