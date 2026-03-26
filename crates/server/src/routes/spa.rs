use axum::http::{header, StatusCode, Uri};
use axum::response::{Html, IntoResponse, Response};
use axum::Router;
use rust_embed::Embed;

use crate::app_state::AppState;

#[derive(Embed)]
#[folder = "../../frontend/dist"]
struct FrontendAssets;

pub fn serve_spa() -> Router<AppState> {
    Router::new().fallback(spa_handler)
}

async fn spa_handler(uri: Uri) -> Response {
    let path = uri.path().trim_start_matches('/');

    if let Some(file) = FrontendAssets::get(path) {
        let mime = file.metadata.mimetype();
        (
            StatusCode::OK,
            [(header::CONTENT_TYPE, mime)],
            file.data,
        )
            .into_response()
    } else if let Some(index) = FrontendAssets::get("index.html") {
        Html(String::from_utf8_lossy(&index.data).into_owned()).into_response()
    } else {
        (StatusCode::NOT_FOUND, "frontend not built").into_response()
    }
}
