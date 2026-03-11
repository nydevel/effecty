#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{delete, get, patch, post, put};
use axum::Router;
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/api/notes", get(handlers::get_tree))
        .route("/api/notes", post(handlers::create_note))
        .route("/api/notes/{id}", get(handlers::get_note))
        .route("/api/notes/{id}", put(handlers::update_note))
        .route("/api/notes/{id}/move", patch(handlers::move_note))
        .route("/api/notes/{id}", delete(handlers::delete_note))
}
