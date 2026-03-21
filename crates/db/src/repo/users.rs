use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{Email, UserId};
use serde::Serialize;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct User {
    pub id: UserId,
    pub email: Email,
    #[serde(skip)]
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn create(pool: &SqlitePool, email: &str, password_hash: &str) -> Result<User> {
    let id = Uuid::new_v4();
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, email, password_hash)
        VALUES (?1, ?2, ?3)
        RETURNING id, email, password_hash, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(email)
    .bind(password_hash)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn find_by_email(pool: &SqlitePool, email: &str) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = ?1",
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn find_by_id(pool: &SqlitePool, id: UserId) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE id = ?1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn update_password(pool: &SqlitePool, id: UserId, password_hash: &str) -> Result<()> {
    sqlx::query("UPDATE users SET password_hash = ?1, updated_at = datetime('now') WHERE id = ?2")
        .bind(password_hash)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}
