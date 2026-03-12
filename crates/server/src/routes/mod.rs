mod health;
mod spa;

use axum::middleware;
use axum::routing::{get, post};
use axum::Router;

use crate::app_state::AppState;
use crate::auth;

pub fn create_router(state: AppState) -> Router {
    let public_routes = Router::new()
        .route("/health", get(health::check))
        .route("/api/auth/login", post(auth::handlers::login))
        .route("/api/auth/register", post(auth::handlers::register));

    let notes_routes = notes::router().with_state(state.pool.clone());

    let tasks_routes = tasks::router().with_state(state.pool.clone());

    let workouts_routes = workouts::router().with_state(state.pool.clone());

    let profile_routes = profile::router().with_state(state.pool.clone());

    let protected_routes = Router::new()
        .route("/api/auth/me", get(auth::handlers::me))
        .merge(notes_routes)
        .merge(tasks_routes)
        .merge(workouts_routes)
        .merge(profile_routes)
        // Clone is cheap: PgPool is Arc-based, config is Arc<Config>
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth::middleware::require_auth,
        ));

    public_routes
        .merge(protected_routes)
        .merge(spa::serve_spa())
        .with_state(state)
}
