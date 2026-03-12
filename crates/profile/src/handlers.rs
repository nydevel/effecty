use axum::extract::State;
use axum::Json;
use effecty_core::types::UserId;
use sqlx::PgPool;

use crate::error::ProfileError;
use db::repo::profiles::{self, UpdateProfile};

pub async fn get_profile(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<profiles::UserProfile>, ProfileError> {
    let profile = profiles::get_or_create(&pool, user_id).await?;
    Ok(Json(profile))
}

pub async fn update_profile(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<UpdateProfile>,
) -> Result<Json<profiles::UserProfile>, ProfileError> {
    if !matches!(input.locale.as_str(), "en" | "ru") {
        return Err(ProfileError::BadRequest(format!(
            "unsupported locale: {}",
            input.locale
        )));
    }

    let profile = profiles::update(&pool, user_id, &input)
        .await?
        .ok_or(ProfileError::NotFound)?;

    Ok(Json(profile))
}
