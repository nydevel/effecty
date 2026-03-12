use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::UserId;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct UserProfile {
    pub id: uuid::Uuid,
    pub user_id: UserId,
    pub locale: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfile {
    pub locale: String,
}

pub async fn get_or_create(pool: &PgPool, user_id: UserId) -> Result<UserProfile> {
    let profile = sqlx::query_as::<_, UserProfile>(
        r#"
        INSERT INTO user_profiles (user_id, locale)
        VALUES ($1, 'en')
        ON CONFLICT (user_id) DO UPDATE SET updated_at = user_profiles.updated_at
        RETURNING id, user_id, locale, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(profile)
}

pub async fn update(
    pool: &PgPool,
    user_id: UserId,
    input: &UpdateProfile,
) -> Result<Option<UserProfile>> {
    let profile = sqlx::query_as::<_, UserProfile>(
        r#"
        UPDATE user_profiles
        SET locale = $2, updated_at = NOW()
        WHERE user_id = $1
        RETURNING id, user_id, locale, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(&input.locale)
    .fetch_optional(pool)
    .await?;

    Ok(profile)
}
