#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{delete, get, patch, post, put};
use axum::Router;
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/api/tasks", get(handlers::list_tasks))
        .route("/api/tasks", post(handlers::create_task))
        .route("/api/tasks/{id}", get(handlers::get_task))
        .route("/api/tasks/{id}", put(handlers::update_task))
        .route("/api/tasks/{id}/move", patch(handlers::move_task))
        .route("/api/tasks/{id}", delete(handlers::delete_task))
}
