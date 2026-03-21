#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{get, post};
use axum::Router;
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        .route("/api/export", get(handlers::export_data))
        .route("/api/import", post(handlers::import_data))
}
