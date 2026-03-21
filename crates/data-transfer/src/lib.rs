#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{get, post};
use axum::Router;
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/api/export", get(handlers::export_data))
        .route("/api/import", post(handlers::import_data))
}
