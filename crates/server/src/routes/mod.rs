mod health;
mod spa;

use std::path::PathBuf;

use axum::middleware;
use axum::routing::{get, post, put};
use axum::Router;
use tower_http::services::ServeDir;

use crate::app_state::AppState;
use crate::auth;

pub fn create_router(state: AppState) -> Router {
    let public_routes = Router::new()
        .route("/health", get(health::check))
        .route("/api/auth/login", post(auth::handlers::login));

    let notes_routes = notes::router().with_state(state.pool.clone());

    let tasks_routes = tasks::router().with_state(state.pool.clone());

    let workouts_routes = workouts::router().with_state(state.pool.clone());

    let profile_routes = profile::router().with_state(state.pool.clone());

    let thoughts_routes = thoughts::router().with_state(state.pool.clone());

    let data_transfer_routes = data_transfer::router().with_state(state.pool.clone());

    let upload_dir = PathBuf::from(&state.config.storage.upload_dir);
    let learning_routes = learning::router()
        .layer(axum::Extension(upload_dir.clone()))
        .with_state(state.pool.clone());

    let protected_routes = Router::new()
        .route("/api/auth/me", get(auth::handlers::me))
        .route("/api/auth/password", put(auth::handlers::change_password))
        .merge(notes_routes)
        .merge(tasks_routes)
        .merge(workouts_routes)
        .merge(profile_routes)
        .merge(thoughts_routes)
        .merge(learning_routes)
        .merge(data_transfer_routes)
        .nest_service("/uploads", ServeDir::new(&upload_dir))
        // Clone is cheap: SqlitePool is Arc-based, config is Arc<Config>
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth::middleware::require_auth,
        ));

    let frontend_dir = PathBuf::from(&state.config.storage.frontend_dir);

    public_routes
        .merge(protected_routes)
        .merge(spa::serve_spa(frontend_dir))
        .with_state(state)
}
