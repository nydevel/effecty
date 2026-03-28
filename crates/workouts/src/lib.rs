#![deny(unsafe_code)]

mod error;
mod handlers;

use axum::routing::{delete, get, patch, post, put};
use axum::Router;
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        // Workouts
        .route("/api/workouts", get(handlers::list_workouts))
        .route("/api/workouts", post(handlers::create_workout))
        .route(
            "/api/workouts/{id}/duplicate",
            post(handlers::duplicate_workout),
        )
        .route("/api/workouts/{id}", put(handlers::update_workout))
        .route("/api/workouts/{id}/move", patch(handlers::move_workout))
        .route("/api/workouts/{id}", delete(handlers::delete_workout))
        // Workout exercises
        .route(
            "/api/workouts/{id}/exercises",
            get(handlers::list_workout_exercises),
        )
        .route("/api/workouts/{id}/exercises", post(handlers::add_exercise))
        .route(
            "/api/workouts/{id}/exercises/{we_id}",
            put(handlers::update_exercise_stats),
        )
        .route(
            "/api/workouts/{id}/exercises/{we_id}/move",
            patch(handlers::move_exercise),
        )
        .route(
            "/api/workouts/{id}/exercises/{we_id}",
            delete(handlers::remove_exercise),
        )
        // Exercise catalog
        .route("/api/exercises", get(handlers::list_exercises))
        .route("/api/exercises", post(handlers::create_exercise))
        .route("/api/exercises/{id}", put(handlers::update_exercise))
        .route("/api/exercises/{id}", delete(handlers::delete_exercise))
}
