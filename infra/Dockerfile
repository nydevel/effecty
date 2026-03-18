# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

# Stage 2: Build Rust backend
FROM rust:latest AS builder

RUN rustup component add rustfmt clippy

WORKDIR /build

# Copy manifests for dependency caching
COPY Cargo.toml Cargo.lock ./
COPY crates/core/Cargo.toml ./crates/core/
COPY crates/db/Cargo.toml ./crates/db/
COPY crates/server/Cargo.toml ./crates/server/
COPY crates/cli/Cargo.toml ./crates/cli/
COPY crates/migration/Cargo.toml ./crates/migration/
COPY crates/notes/Cargo.toml ./crates/notes/
COPY crates/tasks/Cargo.toml ./crates/tasks/
COPY crates/workouts/Cargo.toml ./crates/workouts/
COPY crates/profile/Cargo.toml ./crates/profile/
COPY crates/thoughts/Cargo.toml ./crates/thoughts/
COPY crates/learning/Cargo.toml ./crates/learning/

# Create dummy sources for dependency caching
RUN for crate in core db server cli migration notes tasks workouts profile thoughts learning; do \
        mkdir -p "crates/$crate/src"; \
    done && \
    echo "fn main() {}" > crates/server/src/main.rs && \
    echo "fn main() {}" > crates/cli/src/main.rs && \
    for crate in core db migration notes tasks workouts profile thoughts learning; do \
        echo "pub fn lib() {}" > "crates/$crate/src/lib.rs"; \
    done

ENV SQLX_OFFLINE=true
RUN cargo build --release -p cli

# Remove dummy artifacts
RUN rm -rf crates/ \
    target/release/.fingerprint/core-* \
    target/release/.fingerprint/db-* \
    target/release/.fingerprint/server-* \
    target/release/.fingerprint/cli-* \
    target/release/.fingerprint/migration-* \
    target/release/.fingerprint/notes-* \
    target/release/.fingerprint/tasks-* \
    target/release/.fingerprint/workouts-* \
    target/release/.fingerprint/profile-* \
    target/release/.fingerprint/thoughts-* \
    target/release/.fingerprint/learning-* \
    target/release/deps/libcore-* \
    target/release/deps/libdb-* \
    target/release/deps/libserver-* \
    target/release/deps/cli* \
    target/release/deps/server* \
    target/release/deps/libnotes-* \
    target/release/deps/libtasks-* \
    target/release/deps/libworkouts-* \
    target/release/deps/libprofile-* \
    target/release/deps/libthoughts-* \
    target/release/deps/liblearning-* \
    target/release/deps/libmigration-*

# Copy real source code and pre-built frontend
COPY crates ./crates
COPY --from=frontend-builder /build/frontend/dist /build/frontend/dist
RUN cargo build --release -p server -p cli

# Stage 3: Runtime
FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/release/server /app/bin/server
COPY --from=builder /build/target/release/cli /app/bin/cli
COPY --from=frontend-builder /build/frontend/dist /app/static

COPY infra/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN mkdir -p /app/uploads

EXPOSE 8010

ENTRYPOINT ["/app/entrypoint.sh"]
