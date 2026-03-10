mod health;

use axum::routing::get;
use axum::Router;

pub fn create_router() -> Router {
    Router::new().route("/health", get(health::check))
}
