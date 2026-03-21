#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{delete, get, patch, post, put};
use axum::Router;
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        // Thoughts
        .route("/api/thoughts", get(handlers::list_thoughts))
        .route("/api/thoughts", post(handlers::create_thought))
        .route("/api/thoughts/{id}", put(handlers::update_thought))
        .route("/api/thoughts/{id}/move", patch(handlers::move_thought))
        .route("/api/thoughts/{id}", delete(handlers::delete_thought))
        // Tags
        .route("/api/tags", get(handlers::list_tags))
        .route("/api/tags", post(handlers::create_tag))
        .route("/api/tags/{id}", delete(handlers::delete_tag))
        // Thought tags
        .route("/api/thoughts/{id}/tags", get(handlers::list_thought_tags))
        .route("/api/thoughts/{id}/tags", post(handlers::link_tag))
        .route(
            "/api/thoughts/{id}/tags/{tag_id}",
            delete(handlers::unlink_tag),
        )
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
