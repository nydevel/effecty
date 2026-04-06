use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{ThoughtId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Thought {
    pub id: ThoughtId,
    pub user_id: UserId,
    pub content: String,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateThought {
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateThought {
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MoveThought {
    pub position: f64,
}

pub async fn list(pool: &SqlitePool, user_id: UserId) -> Result<Vec<Thought>> {
    let thoughts = sqlx::query_as::<_, Thought>(
        "SELECT id, user_id, content, position, created_at, updated_at \
         FROM thoughts WHERE user_id = ?1 ORDER BY position, updated_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(thoughts)
}

pub async fn get(pool: &SqlitePool, id: ThoughtId, user_id: UserId) -> Result<Option<Thought>> {
    let thought = sqlx::query_as::<_, Thought>(
        "SELECT id, user_id, content, position, created_at, updated_at \
         FROM thoughts WHERE id = ?1 AND user_id = ?2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(thought)
}

pub async fn create(pool: &SqlitePool, user_id: UserId, input: &CreateThought) -> Result<Thought> {
    let min_pos = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MIN(position) FROM thoughts WHERE user_id = ?1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let position = min_pos.map_or(0.0, |pos| pos - 1.0);

    let id = Uuid::new_v4();
    let thought = sqlx::query_as::<_, Thought>(
        r#"
        INSERT INTO thoughts (id, user_id, content, position)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING id, user_id, content, position, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.content.as_deref().unwrap_or(""))
    .bind(position)
    .fetch_one(pool)
    .await?;

    Ok(thought)
}

pub async fn update(
    pool: &SqlitePool,
    id: ThoughtId,
    user_id: UserId,
    input: &UpdateThought,
) -> Result<Option<Thought>> {
    let thought = sqlx::query_as::<_, Thought>(
        r#"
        UPDATE thoughts
        SET content = COALESCE(?3, content),
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        RETURNING id, user_id, content, position, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.content)
    .fetch_optional(pool)
    .await?;

    Ok(thought)
}

pub async fn move_thought(
    pool: &SqlitePool,
    id: ThoughtId,
    user_id: UserId,
    input: &MoveThought,
) -> Result<Option<Thought>> {
    let thought = sqlx::query_as::<_, Thought>(
        r#"
        UPDATE thoughts
        SET position = ?3,
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        RETURNING id, user_id, content, position, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.position)
    .fetch_optional(pool)
    .await?;

    Ok(thought)
}

pub async fn delete(pool: &SqlitePool, id: ThoughtId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM thoughts WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
