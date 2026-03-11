use axum::extract::Request;
use axum::middleware::Next;
use axum::response::Response;

use crate::app_state::AppState;
use crate::error::AppError;

use super::jwt;

pub async fn require_auth(
    state: axum::extract::State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(AppError::Unauthorized)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AppError::Unauthorized)?;

    let claims = jwt::validate_token(token, &state.config.auth.jwt_secret)?;

    request.extensions_mut().insert(claims.sub);

    Ok(next.run(request).await)
}
