mod health;
pub mod notes;
mod spa;

use axum::middleware;
use axum::routing::{delete, get, patch, post, put};
use axum::Router;

use crate::app_state::AppState;
use crate::auth;

pub fn create_router(state: AppState) -> Router {
    let public_routes = Router::new()
        .route("/health", get(health::check))
        .route("/api/auth/login", post(auth::handlers::login))
        .route("/api/auth/register", post(auth::handlers::register));

    let protected_routes = Router::new()
        .route("/api/auth/me", get(auth::handlers::me))
        .route("/api/notes", get(notes::get_tree))
        .route("/api/notes", post(notes::create_note))
        .route("/api/notes/{id}", get(notes::get_note))
        .route("/api/notes/{id}", put(notes::update_note))
        .route("/api/notes/{id}/move", patch(notes::move_note))
        .route("/api/notes/{id}", delete(notes::delete_note))
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
