use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{MedicalImageId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct MedicalImage {
    pub id: MedicalImageId,
    pub user_id: UserId,
    pub owner_type: String,
    pub owner_id: String,
    pub file_path: String,
    pub position: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMedicalImage {
    pub owner_type: String,
    pub owner_id: String,
    pub file_path: String,
}

pub async fn list_by_owner(
    pool: &SqlitePool,
    owner_type: &str,
    owner_id: &str,
    user_id: UserId,
) -> Result<Vec<MedicalImage>> {
    let rows = sqlx::query_as::<_, MedicalImage>(
        r#"
        SELECT * FROM medical_images
        WHERE owner_type = ?1 AND owner_id = ?2 AND user_id = ?3
        ORDER BY position, created_at
        "#,
    )
    .bind(owner_type)
    .bind(owner_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn create(
    pool: &SqlitePool,
    user_id: UserId,
    input: &CreateMedicalImage,
) -> Result<MedicalImage> {
    let id = Uuid::new_v4();

    let max_pos = sqlx::query_scalar::<_, Option<i32>>(
        r#"
        SELECT MAX(position) FROM medical_images
        WHERE owner_type = ?1 AND owner_id = ?2 AND user_id = ?3
        "#,
    )
    .bind(&input.owner_type)
    .bind(&input.owner_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let position = max_pos.unwrap_or(-1) + 1;

    let row = sqlx::query_as::<_, MedicalImage>(
        r#"
        INSERT INTO medical_images (id, user_id, owner_type, owner_id, file_path, position)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.owner_type)
    .bind(&input.owner_id)
    .bind(&input.file_path)
    .bind(position)
    .fetch_one(pool)
    .await?;

    Ok(row)
}

pub async fn delete(pool: &SqlitePool, id: MedicalImageId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM medical_images WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
