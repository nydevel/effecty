use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum ProfileError {
    #[error("not found")]
    NotFound,

    #[error("bad request: {0}")]
    BadRequest(String),

    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

impl From<sqlx::Error> for ProfileError {
    fn from(err: sqlx::Error) -> Self {
        Self::Internal(err.into())
    }
}

impl IntoResponse for ProfileError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            Self::NotFound => (StatusCode::NOT_FOUND, "not found".into()),
            Self::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            Self::Internal(err) => {
                tracing::error!("profile error: {err:#}");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal error".into())
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}
