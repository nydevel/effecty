use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{MaterialCommentId, MaterialId, UserId};
use serde::Serialize;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct MaterialComment {
    pub id: MaterialCommentId,
    pub material_id: MaterialId,
    pub user_id: UserId,
    pub comment_type: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list(
    pool: &SqlitePool,
    material_id: MaterialId,
    user_id: UserId,
) -> Result<Vec<MaterialComment>> {
    let comments = sqlx::query_as::<_, MaterialComment>(
        r#"
        SELECT mc.id, mc.material_id, mc.user_id, mc.comment_type, mc.content,
               mc.created_at, mc.updated_at
        FROM material_comments mc
        JOIN materials m ON m.id = mc.material_id
        WHERE mc.material_id = ?1 AND m.user_id = ?2
        ORDER BY mc.created_at ASC
        "#,
    )
    .bind(material_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(comments)
}

pub async fn create(
    pool: &SqlitePool,
    material_id: MaterialId,
    user_id: UserId,
    comment_type: &str,
    content: &str,
) -> Result<MaterialComment> {
    let id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO material_comments (id, material_id, user_id, comment_type, content)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
    )
    .bind(id)
    .bind(material_id)
    .bind(user_id)
    .bind(comment_type)
    .bind(content)
    .execute(pool)
    .await?;

    let comment = sqlx::query_as::<_, MaterialComment>(
        "SELECT id, material_id, user_id, comment_type, content, created_at, updated_at \
         FROM material_comments WHERE id = ?1",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(comment)
}

pub async fn delete(pool: &SqlitePool, id: MaterialCommentId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query(
        r#"
        DELETE FROM material_comments
        WHERE id = ?1 AND user_id = ?2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
