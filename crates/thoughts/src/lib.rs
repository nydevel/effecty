#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{delete, get, post, put};
use axum::Router;
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        // Thoughts
        .route("/api/thoughts", get(handlers::list_thoughts))
        .route("/api/thoughts", post(handlers::create_thought))
        .route("/api/thoughts/{id}", put(handlers::update_thought))
        .route("/api/thoughts/{id}", delete(handlers::delete_thought))
        // Thought comments
        .route("/api/thoughts/{id}/comments", get(handlers::list_comments))
        .route(
            "/api/thoughts/{id}/comments",
            post(handlers::create_comment),
        )
        .route(
            "/api/thoughts/{id}/comments/{comment_id}",
            delete(handlers::delete_comment),
        )
}
