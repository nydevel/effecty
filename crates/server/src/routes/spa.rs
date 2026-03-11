use axum::response::{Html, IntoResponse, Response};
use axum::Router;
use tower_http::services::ServeDir;

use crate::app_state::AppState;

pub fn serve_spa() -> Router<AppState> {
    let serve_dir = ServeDir::new("frontend/dist")
        .not_found_service(axum::routing::get(spa_fallback));

    Router::new().fallback_service(serve_dir)
}

async fn spa_fallback() -> Response {
    match tokio::fs::read_to_string("frontend/dist/index.html").await {
        Ok(html) => Html(html).into_response(),
        Err(err) => {
            tracing::warn!("failed to read frontend/dist/index.html: {err}");
            Html("<h1>Frontend not built. Run: cd frontend &amp;&amp; npm run build</h1>".to_owned())
                .into_response()
        }
    }
}
