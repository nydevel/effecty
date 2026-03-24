use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{SpecialtyId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Specialty {
    pub id: SpecialtyId,
    pub user_id: UserId,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSpecialty {
    pub name: String,
}

pub async fn list(pool: &SqlitePool, user_id: UserId) -> Result<Vec<Specialty>> {
    let rows = sqlx::query_as::<_, Specialty>(
        "SELECT * FROM medical_specialties WHERE user_id = ?1 ORDER BY name",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn create(
    pool: &SqlitePool,
    user_id: UserId,
    input: &CreateSpecialty,
) -> Result<Specialty> {
    let id = Uuid::new_v4();
    let row = sqlx::query_as::<_, Specialty>(
        r#"
        INSERT INTO medical_specialties (id, user_id, name)
        VALUES (?1, ?2, ?3)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.name)
    .fetch_one(pool)
    .await?;

    Ok(row)
}

pub async fn delete(pool: &SqlitePool, id: SpecialtyId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM medical_specialties WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
