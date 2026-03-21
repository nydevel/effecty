use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{ThoughtCommentId, ThoughtId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct ThoughtComment {
    pub id: ThoughtCommentId,
    pub thought_id: ThoughtId,
    pub user_id: UserId,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateComment {
    pub content: String,
}

pub async fn list(
    pool: &PgPool,
    thought_id: ThoughtId,
    user_id: UserId,
) -> Result<Vec<ThoughtComment>> {
    let comments = sqlx::query_as::<_, ThoughtComment>(
        r#"
        SELECT tc.*
        FROM thought_comments tc
        JOIN thoughts t ON t.id = tc.thought_id
        WHERE tc.thought_id = $1 AND t.user_id = $2
        ORDER BY tc.created_at
        "#,
    )
    .bind(thought_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(comments)
}

pub async fn create(
    pool: &PgPool,
    thought_id: ThoughtId,
    user_id: UserId,
    input: &CreateComment,
) -> Result<ThoughtComment> {
    let comment = sqlx::query_as::<_, ThoughtComment>(
        r#"
        INSERT INTO thought_comments (thought_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(thought_id)
    .bind(user_id)
    .bind(&input.content)
    .fetch_one(pool)
    .await?;

    Ok(comment)
}

pub async fn delete(pool: &PgPool, id: ThoughtCommentId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM thought_comments WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
