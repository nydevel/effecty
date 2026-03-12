#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{get, put};
use axum::Router;
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/api/profile", get(handlers::get_profile))
        .route("/api/profile", put(handlers::update_profile))
}
