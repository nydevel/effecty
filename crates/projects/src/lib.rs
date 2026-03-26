#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{delete, get, post, put};
use axum::Router;
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        // Projects
        .route("/api/projects", get(handlers::list_projects))
        .route("/api/projects", post(handlers::create_project))
        .route("/api/projects/{id}", put(handlers::update_project))
        .route("/api/projects/{id}", delete(handlers::delete_project))
        // Project tasks
        .route("/api/projects/{id}/tasks", get(handlers::list_tasks))
        .route("/api/projects/{id}/tasks", post(handlers::create_task))
        .route(
            "/api/projects/{id}/tasks/search",
            get(handlers::search_tasks),
        )
        .route(
            "/api/projects/{id}/tasks/{task_id}",
            put(handlers::update_task),
        )
        .route(
            "/api/projects/{id}/tasks/{task_id}",
            delete(handlers::delete_task),
        )
        // Task links
        .route(
            "/api/projects/{id}/tasks/{task_id}/links",
            get(handlers::list_task_links),
        )
        .route(
            "/api/projects/{id}/tasks/{task_id}/links",
            post(handlers::link_task),
        )
        .route(
            "/api/projects/{id}/tasks/{task_id}/links/{target_id}",
            delete(handlers::unlink_task),
        )
}
