use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{TagId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Tag {
    pub id: TagId,
    pub user_id: UserId,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTag {
    pub name: String,
}

pub async fn list(pool: &PgPool, user_id: UserId) -> Result<Vec<Tag>> {
    let tags = sqlx::query_as::<_, Tag>("SELECT * FROM tags WHERE user_id = $1 ORDER BY name")
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    Ok(tags)
}

pub async fn create(pool: &PgPool, user_id: UserId, input: &CreateTag) -> Result<Tag> {
    let name = input.name.split_whitespace().collect::<Vec<_>>().join(" ");

    let tag = sqlx::query_as::<_, Tag>(
        r#"
        INSERT INTO tags (user_id, name)
        VALUES ($1, $2)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(&name)
    .fetch_one(pool)
    .await?;

    Ok(tag)
}

pub async fn delete(pool: &PgPool, id: TagId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM tags WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
