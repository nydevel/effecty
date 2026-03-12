use anyhow::Result;
use effecty_core::types::{TagId, ThoughtId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct ThoughtTag {
    pub id: Uuid,
    pub thought_id: ThoughtId,
    pub tag_id: TagId,
    pub tag_name: String,
}

#[derive(Debug, Deserialize)]
pub struct LinkTag {
    pub tag_id: TagId,
}

pub async fn list(
    pool: &PgPool,
    thought_id: ThoughtId,
    user_id: UserId,
) -> Result<Vec<ThoughtTag>> {
    let tags = sqlx::query_as::<_, ThoughtTag>(
        r#"
        SELECT tt.id, tt.thought_id, tt.tag_id, t.name AS tag_name
        FROM thought_tags tt
        JOIN tags t ON t.id = tt.tag_id
        JOIN thoughts th ON th.id = tt.thought_id
        WHERE tt.thought_id = $1 AND th.user_id = $2
        ORDER BY t.name
        "#,
    )
    .bind(thought_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(tags)
}

pub async fn link(
    pool: &PgPool,
    thought_id: ThoughtId,
    tag_id: TagId,
    user_id: UserId,
) -> Result<Option<ThoughtTag>> {
    // Verify ownership of both thought and tag
    let thought_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM thoughts WHERE id = $1 AND user_id = $2)",
    )
    .bind(thought_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !thought_exists {
        return Ok(None);
    }

    let tag_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM tags WHERE id = $1 AND user_id = $2)",
    )
    .bind(tag_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !tag_exists {
        return Ok(None);
    }

    let tt = sqlx::query_as::<_, ThoughtTag>(
        r#"
        INSERT INTO thought_tags (thought_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (thought_id, tag_id) DO NOTHING
        RETURNING id, thought_id, tag_id,
                  (SELECT name FROM tags WHERE id = $2) AS tag_name
        "#,
    )
    .bind(thought_id)
    .bind(tag_id)
    .fetch_optional(pool)
    .await?;

    Ok(tt)
}

pub async fn unlink(
    pool: &PgPool,
    thought_id: ThoughtId,
    tag_id: TagId,
    user_id: UserId,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        DELETE FROM thought_tags tt
        USING thoughts th
        WHERE tt.thought_id = $1 AND tt.tag_id = $2
              AND th.id = tt.thought_id AND th.user_id = $3
        "#,
    )
    .bind(thought_id)
    .bind(tag_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
