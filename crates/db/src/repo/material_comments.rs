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
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_mime: Option<String>,
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
               mc.file_path, mc.file_name, mc.file_mime,
               mc.created_at, mc.updated_at
        FROM material_comments mc
        JOIN materials m ON m.id = mc.material_id
        WHERE mc.material_id = ?1 AND m.user_id = ?2
        ORDER BY mc.created_at DESC, mc.id DESC
        "#,
    )
    .bind(material_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(comments)
}

pub async fn get(
    pool: &SqlitePool,
    id: MaterialCommentId,
    user_id: UserId,
) -> Result<Option<MaterialComment>> {
    let comment = sqlx::query_as::<_, MaterialComment>(
        r#"
        SELECT id, material_id, user_id, comment_type, content,
               file_path, file_name, file_mime,
               created_at, updated_at
        FROM material_comments
        WHERE id = ?1 AND user_id = ?2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(comment)
}

pub async fn create(
    pool: &SqlitePool,
    material_id: MaterialId,
    user_id: UserId,
    comment_type: &str,
    content: &str,
    file_path: Option<&str>,
    file_name: Option<&str>,
    file_mime: Option<&str>,
) -> Result<MaterialComment> {
    let id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO material_comments (
            id, material_id, user_id, comment_type, content, file_path, file_name, file_mime
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
    )
    .bind(id)
    .bind(material_id)
    .bind(user_id)
    .bind(comment_type)
    .bind(content)
    .bind(file_path)
    .bind(file_name)
    .bind(file_mime)
    .execute(pool)
    .await?;

    let comment = sqlx::query_as::<_, MaterialComment>(
        "SELECT id, material_id, user_id, comment_type, content, file_path, file_name, file_mime, created_at, updated_at \
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
