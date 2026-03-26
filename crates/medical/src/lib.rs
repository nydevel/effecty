#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{delete, get, post, put};
use axum::Router;
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        // Specialties
        .route("/api/specialties", get(handlers::list_specialties))
        .route("/api/specialties", post(handlers::create_specialty))
        .route("/api/specialties/{id}", delete(handlers::delete_specialty))
        // Doctor visits
        .route("/api/doctor-visits", get(handlers::list_visits))
        .route("/api/doctor-visits", post(handlers::create_visit))
        .route("/api/doctor-visits/{id}", get(handlers::get_visit))
        .route("/api/doctor-visits/{id}", put(handlers::update_visit))
        .route("/api/doctor-visits/{id}", delete(handlers::delete_visit))
        // Analyses
        .route("/api/analyses", get(handlers::list_analyses))
        .route("/api/analyses", post(handlers::create_analysis))
        .route("/api/analyses/{id}", get(handlers::get_analysis))
        .route("/api/analyses/{id}", put(handlers::update_analysis))
        .route("/api/analyses/{id}", delete(handlers::delete_analysis))
        // Medical images (shared)
        .route(
            "/api/medical-images",
            get(handlers::list_images).post(handlers::upload_image),
        )
        .route(
            "/api/medical-images/{id}",
            delete(handlers::delete_image),
        )
}
