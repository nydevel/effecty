use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{AnalysisId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Analysis {
    pub id: AnalysisId,
    pub user_id: UserId,
    pub title: String,
    pub analysis_date: String,
    pub notes: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

const ANALYSIS_COLUMNS: &str = "id, user_id, title, analysis_date, notes, created_at, updated_at";

#[derive(Debug, Deserialize)]
pub struct CreateAnalysis {
    pub title: String,
    pub analysis_date: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAnalysis {
    pub title: Option<String>,
    pub analysis_date: Option<String>,
    pub notes: Option<String>,
}

pub async fn list(pool: &SqlitePool, user_id: UserId) -> Result<Vec<Analysis>> {
    let query = format!(
        "SELECT {ANALYSIS_COLUMNS} FROM analyses WHERE user_id = ?1 ORDER BY analysis_date DESC",
    );
    let rows = sqlx::query_as::<_, Analysis>(&query)
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    Ok(rows)
}

pub async fn get(pool: &SqlitePool, id: AnalysisId, user_id: UserId) -> Result<Option<Analysis>> {
    let query = format!("SELECT {ANALYSIS_COLUMNS} FROM analyses WHERE id = ?1 AND user_id = ?2",);
    let row = sqlx::query_as::<_, Analysis>(&query)
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    Ok(row)
}

pub async fn create(
    pool: &SqlitePool,
    user_id: UserId,
    input: &CreateAnalysis,
) -> Result<Analysis> {
    let id = Uuid::new_v4();
    let query = format!(
        r#"
        INSERT INTO analyses (id, user_id, title, analysis_date)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING {ANALYSIS_COLUMNS}
        "#,
    );
    let row = sqlx::query_as::<_, Analysis>(&query)
        .bind(id)
        .bind(user_id)
        .bind(&input.title)
        .bind(&input.analysis_date)
        .fetch_one(pool)
        .await?;

    Ok(row)
}

pub async fn update(
    pool: &SqlitePool,
    id: AnalysisId,
    user_id: UserId,
    input: &UpdateAnalysis,
) -> Result<Option<Analysis>> {
    let query = format!(
        r#"
        UPDATE analyses
        SET title = COALESCE(?3, title),
            analysis_date = COALESCE(?4, analysis_date),
            notes = COALESCE(?5, notes),
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        RETURNING {ANALYSIS_COLUMNS}
        "#,
    );
    let row = sqlx::query_as::<_, Analysis>(&query)
        .bind(id)
        .bind(user_id)
        .bind(&input.title)
        .bind(&input.analysis_date)
        .bind(&input.notes)
        .fetch_optional(pool)
        .await?;

    Ok(row)
}

pub async fn delete(pool: &SqlitePool, id: AnalysisId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM analyses WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
