use std::path::PathBuf;

use axum::response::{Html, IntoResponse, Response};
use axum::Router;
use tower_http::services::ServeDir;

use crate::app_state::AppState;

pub fn serve_spa(frontend_dir: PathBuf) -> Router<AppState> {
    let index_path = frontend_dir.join("index.html");
    let serve_dir = ServeDir::new(&frontend_dir)
        .not_found_service(axum::routing::get(move || spa_fallback(index_path)));

    Router::new().fallback_service(serve_dir)
}

async fn spa_fallback(index_path: PathBuf) -> Response {
    match tokio::fs::read_to_string(&index_path).await {
        Ok(html) => Html(html).into_response(),
        Err(err) => {
            tracing::warn!("failed to read {}: {err}", index_path.display());
            Html(
                "<h1>Frontend not built. Run: cd frontend &amp;&amp; npm run build</h1>".to_owned(),
            )
            .into_response()
        }
    }
}
