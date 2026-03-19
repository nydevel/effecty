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
        // Memos (belong to memolist notes)
        .route(
            "/api/notes/{note_id}/memos",
            get(handlers::list_memos).post(handlers::create_memo),
        )
        .route(
            "/api/notes/{note_id}/memos/{memo_id}",
            put(handlers::update_memo).delete(handlers::delete_memo),
        )
        .route(
            "/api/notes/{note_id}/memos/reorder",
            patch(handlers::reorder_memos),
        )
}
