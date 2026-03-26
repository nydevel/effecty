#![deny(unsafe_code)]

mod error;
mod handlers;
pub mod thumbnail;

use axum::routing::{delete, get, patch, post, put};
use axum::Router;
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        // Topics
        .route("/api/topics", get(handlers::list_topics))
        .route("/api/topics", post(handlers::create_topic))
        .route("/api/topics/{id}", put(handlers::update_topic))
        .route("/api/topics/{id}", delete(handlers::delete_topic))
        // Topic tags
        .route("/api/topics/{id}/tags", get(handlers::list_topic_tags))
        .route("/api/topics/{id}/tags", post(handlers::link_topic_tag))
        .route(
            "/api/topics/{id}/tags/{tag_id}",
            delete(handlers::unlink_topic_tag),
        )
        // Tags (shared, but accessible from learning context)
        .route("/api/learning/tags", get(handlers::list_tags))
        .route("/api/learning/tags", post(handlers::create_tag))
        // URL metadata
        .route("/api/learning/fetch-title", post(handlers::fetch_url_title))
        // Materials
        .route("/api/materials", get(handlers::list_materials))
        .route(
            "/api/materials/by-topic/{topic_id}",
            get(handlers::list_materials_by_topic),
        )
        .route("/api/materials", post(handlers::create_material))
        .route("/api/materials/{id}", put(handlers::update_material))
        .route("/api/materials/{id}", delete(handlers::delete_material))
        .route(
            "/api/materials/{id}/status",
            patch(handlers::set_material_status),
        )
        .route("/api/materials/search", get(handlers::search_materials))
        .route(
            "/api/materials/{id}/upload",
            post(handlers::upload_material_file),
        )
        // Material topics
        .route(
            "/api/materials/{id}/topics",
            get(handlers::list_material_topics),
        )
        .route(
            "/api/materials/{id}/topics",
            post(handlers::link_material_topic),
        )
        .route(
            "/api/materials/{id}/topics/{topic_id}",
            delete(handlers::unlink_material_topic),
        )
        // Material comments
        .route(
            "/api/materials/{id}/comments",
            get(handlers::list_material_comments),
        )
        .route(
            "/api/materials/{id}/comments",
            post(handlers::create_material_comment),
        )
        .route(
            "/api/materials/{id}/comments/{comment_id}",
            delete(handlers::delete_material_comment),
        )
        // Material links
        .route(
            "/api/materials/{id}/links",
            get(handlers::list_material_links),
        )
        .route("/api/materials/{id}/links", post(handlers::link_material))
        .route(
            "/api/materials/{id}/links/{target_id}",
            delete(handlers::unlink_material),
        )
        // Roadmap nodes
        .route("/api/roadmap/nodes", get(handlers::list_roadmap_nodes))
        .route("/api/roadmap/nodes", post(handlers::create_roadmap_node))
        .route(
            "/api/roadmap/nodes/{id}",
            put(handlers::update_roadmap_node),
        )
        .route(
            "/api/roadmap/nodes/{id}",
            delete(handlers::delete_roadmap_node),
        )
}
