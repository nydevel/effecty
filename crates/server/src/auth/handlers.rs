use axum::extract::State;
use axum::Json;
use effecty_core::types::{Email, UserId};
use serde::{Deserialize, Serialize};

use crate::app_state::AppState;
use crate::error::AppError;

use super::jwt;
use super::password;

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct MeResponse {
    pub id: UserId,
    pub email: Email,
}

pub async fn login(
    State(state): State<AppState>,
    Json(input): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let user = db::repo::users::find_by_email(&state.pool, &input.email)
        .await?
        .ok_or(AppError::Unauthorized)?;

    if !password::verify(&input.password, &user.password_hash)? {
        return Err(AppError::Unauthorized);
    }

    let token = jwt::create_token(
        user.id,
        &state.config.auth.jwt_secret,
        state.config.auth.jwt_expiration_hours,
    )?;

    Ok(Json(AuthResponse { token }))
}

pub async fn register(
    State(state): State<AppState>,
    Json(input): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    if !state.config.auth.registration_enabled {
        return Err(AppError::Forbidden("registration is disabled".into()));
    }

    let hash = password::hash(&input.password)?;

    let user = db::repo::users::create(&state.pool, &input.email, &hash).await?;

    let token = jwt::create_token(
        user.id,
        &state.config.auth.jwt_secret,
        state.config.auth.jwt_expiration_hours,
    )?;

    Ok(Json(AuthResponse { token }))
}

pub async fn me(
    State(state): State<AppState>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<MeResponse>, AppError> {
    let user = db::repo::users::find_by_id(&state.pool, user_id)
        .await?
        .ok_or(AppError::NotFound)?;

    Ok(Json(MeResponse {
        id: user.id,
        email: user.email,
    }))
}
