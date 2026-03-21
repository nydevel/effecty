use anyhow::Result;
use effecty_core::types::{MaterialId, TopicId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct MaterialTopic {
    pub id: Uuid,
    pub material_id: MaterialId,
    pub topic_id: TopicId,
    pub topic_name: String,
}

#[derive(Debug, Deserialize)]
pub struct LinkTopic {
    pub topic_id: TopicId,
}

pub async fn list(
    pool: &SqlitePool,
    material_id: MaterialId,
    user_id: UserId,
) -> Result<Vec<MaterialTopic>> {
    let topics = sqlx::query_as::<_, MaterialTopic>(
        r#"
        SELECT mt.id, mt.material_id, mt.topic_id, tp.name AS topic_name
        FROM material_topics mt
        JOIN topics tp ON tp.id = mt.topic_id
        JOIN materials m ON m.id = mt.material_id
        WHERE mt.material_id = ?1 AND m.user_id = ?2
        ORDER BY tp.name
        "#,
    )
    .bind(material_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(topics)
}

pub async fn link(
    pool: &SqlitePool,
    material_id: MaterialId,
    topic_id: TopicId,
    user_id: UserId,
) -> Result<Option<MaterialTopic>> {
    let material_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM materials WHERE id = ?1 AND user_id = ?2)",
    )
    .bind(material_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !material_exists {
        return Ok(None);
    }

    let topic_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM topics WHERE id = ?1 AND user_id = ?2)",
    )
    .bind(topic_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !topic_exists {
        return Ok(None);
    }

    let id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO material_topics (id, material_id, topic_id)
        VALUES (?1, ?2, ?3)
        ON CONFLICT (material_id, topic_id) DO NOTHING
        "#,
    )
    .bind(id)
    .bind(material_id)
    .bind(topic_id)
    .execute(pool)
    .await?;

    let mt = sqlx::query_as::<_, MaterialTopic>(
        r#"
        SELECT mt.id, mt.material_id, mt.topic_id, tp.name AS topic_name
        FROM material_topics mt
        JOIN topics tp ON tp.id = mt.topic_id
        WHERE mt.material_id = ?1 AND mt.topic_id = ?2
        "#,
    )
    .bind(material_id)
    .bind(topic_id)
    .fetch_optional(pool)
    .await?;

    Ok(mt)
}

pub async fn unlink(
    pool: &SqlitePool,
    material_id: MaterialId,
    topic_id: TopicId,
    user_id: UserId,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        DELETE FROM material_topics
        WHERE material_id = ?1 AND topic_id = ?2
              AND EXISTS(SELECT 1 FROM materials WHERE id = ?1 AND user_id = ?3)
        "#,
    )
    .bind(material_id)
    .bind(topic_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
