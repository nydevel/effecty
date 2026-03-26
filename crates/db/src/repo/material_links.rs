use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{MaterialId, MaterialLinkId, UserId};
use serde::Serialize;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct MaterialLink {
    pub id: MaterialLinkId,
    pub source_material_id: MaterialId,
    pub target_material_id: MaterialId,
    pub target_title: String,
    pub target_material_type: String,
    pub created_at: DateTime<Utc>,
}

pub async fn list(
    pool: &SqlitePool,
    source_id: MaterialId,
    user_id: UserId,
) -> Result<Vec<MaterialLink>> {
    let links = sqlx::query_as::<_, MaterialLink>(
        r#"
        SELECT ml.id, ml.source_material_id, ml.target_material_id,
               m.title AS target_title, m.material_type AS target_material_type,
               ml.created_at
        FROM material_links ml
        JOIN materials m ON m.id = ml.target_material_id
        WHERE ml.source_material_id = ?1 AND ml.user_id = ?2
        ORDER BY ml.created_at DESC
        "#,
    )
    .bind(source_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(links)
}

pub async fn link(
    pool: &SqlitePool,
    source_id: MaterialId,
    target_id: MaterialId,
    user_id: UserId,
) -> Result<Option<MaterialLink>> {
    if source_id == target_id {
        return Ok(None);
    }

    let id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO material_links (id, source_material_id, target_material_id, user_id)
        VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT (source_material_id, target_material_id) DO NOTHING
        "#,
    )
    .bind(id)
    .bind(source_id)
    .bind(target_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    let link = sqlx::query_as::<_, MaterialLink>(
        r#"
        SELECT ml.id, ml.source_material_id, ml.target_material_id,
               m.title AS target_title, m.material_type AS target_material_type,
               ml.created_at
        FROM material_links ml
        JOIN materials m ON m.id = ml.target_material_id
        WHERE ml.source_material_id = ?1 AND ml.target_material_id = ?2
        "#,
    )
    .bind(source_id)
    .bind(target_id)
    .fetch_optional(pool)
    .await?;

    Ok(link)
}

pub async fn unlink(
    pool: &SqlitePool,
    source_id: MaterialId,
    target_id: MaterialId,
    user_id: UserId,
) -> Result<bool> {
    let result = sqlx::query(
        "DELETE FROM material_links WHERE source_material_id = ?1 AND target_material_id = ?2 AND user_id = ?3",
    )
    .bind(source_id)
    .bind(target_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
