use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{TopicId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Topic {
    pub id: TopicId,
    pub user_id: UserId,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTopic {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTopic {
    pub name: Option<String>,
}

pub async fn list(pool: &PgPool, user_id: UserId) -> Result<Vec<Topic>> {
    let topics =
        sqlx::query_as::<_, Topic>("SELECT * FROM topics WHERE user_id = $1 ORDER BY name")
            .bind(user_id)
            .fetch_all(pool)
            .await?;

    Ok(topics)
}

pub async fn get(pool: &PgPool, id: TopicId, user_id: UserId) -> Result<Option<Topic>> {
    let topic = sqlx::query_as::<_, Topic>("SELECT * FROM topics WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    Ok(topic)
}

pub async fn create(pool: &PgPool, user_id: UserId, input: &CreateTopic) -> Result<Topic> {
    let name = input.name.split_whitespace().collect::<Vec<_>>().join(" ");

    let topic = sqlx::query_as::<_, Topic>(
        r#"
        INSERT INTO topics (user_id, name)
        VALUES ($1, $2)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(&name)
    .fetch_one(pool)
    .await?;

    Ok(topic)
}

pub async fn update(
    pool: &PgPool,
    id: TopicId,
    user_id: UserId,
    input: &UpdateTopic,
) -> Result<Option<Topic>> {
    let topic = sqlx::query_as::<_, Topic>(
        r#"
        UPDATE topics
        SET name = COALESCE($3, name),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.name)
    .fetch_optional(pool)
    .await?;

    Ok(topic)
}

pub async fn delete(pool: &PgPool, id: TopicId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM topics WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
