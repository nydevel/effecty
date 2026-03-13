use anyhow::Result;
use effecty_core::types::{TagId, TopicId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct TopicTag {
    pub id: Uuid,
    pub topic_id: TopicId,
    pub tag_id: TagId,
    pub tag_name: String,
}

#[derive(Debug, Deserialize)]
pub struct LinkTag {
    pub tag_id: TagId,
}

pub async fn list(pool: &PgPool, topic_id: TopicId, user_id: UserId) -> Result<Vec<TopicTag>> {
    let tags = sqlx::query_as::<_, TopicTag>(
        r#"
        SELECT tt.id, tt.topic_id, tt.tag_id, t.name AS tag_name
        FROM topic_tags tt
        JOIN tags t ON t.id = tt.tag_id
        JOIN topics tp ON tp.id = tt.topic_id
        WHERE tt.topic_id = $1 AND tp.user_id = $2
        ORDER BY t.name
        "#,
    )
    .bind(topic_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(tags)
}

pub async fn link(
    pool: &PgPool,
    topic_id: TopicId,
    tag_id: TagId,
    user_id: UserId,
) -> Result<Option<TopicTag>> {
    let topic_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM topics WHERE id = $1 AND user_id = $2)",
    )
    .bind(topic_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !topic_exists {
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

    let tt = sqlx::query_as::<_, TopicTag>(
        r#"
        INSERT INTO topic_tags (topic_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (topic_id, tag_id) DO NOTHING
        RETURNING id, topic_id, tag_id,
                  (SELECT name FROM tags WHERE id = $2) AS tag_name
        "#,
    )
    .bind(topic_id)
    .bind(tag_id)
    .fetch_optional(pool)
    .await?;

    Ok(tt)
}

pub async fn unlink(
    pool: &PgPool,
    topic_id: TopicId,
    tag_id: TagId,
    user_id: UserId,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        DELETE FROM topic_tags tt
        USING topics tp
        WHERE tt.topic_id = $1 AND tt.tag_id = $2
              AND tp.id = tt.topic_id AND tp.user_id = $3
        "#,
    )
    .bind(topic_id)
    .bind(tag_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
