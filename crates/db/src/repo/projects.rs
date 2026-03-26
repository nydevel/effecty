use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{ProjectId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Project {
    pub id: ProjectId,
    pub user_id: UserId,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProject {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProject {
    pub name: Option<String>,
}

pub async fn list(pool: &SqlitePool, user_id: UserId) -> Result<Vec<Project>> {
    let projects = sqlx::query_as::<_, Project>(
        "SELECT id, user_id, name, created_at, updated_at \
         FROM projects WHERE user_id = ?1 ORDER BY name",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(projects)
}

pub async fn create(pool: &SqlitePool, user_id: UserId, input: &CreateProject) -> Result<Project> {
    let id = Uuid::new_v4();
    sqlx::query("INSERT INTO projects (id, user_id, name) VALUES (?1, ?2, ?3)")
        .bind(id)
        .bind(user_id)
        .bind(&input.name)
        .execute(pool)
        .await?;

    let project = sqlx::query_as::<_, Project>(
        "SELECT id, user_id, name, created_at, updated_at FROM projects WHERE id = ?1",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(project)
}

pub async fn update(
    pool: &SqlitePool,
    id: ProjectId,
    user_id: UserId,
    input: &UpdateProject,
) -> Result<Option<Project>> {
    let result = sqlx::query(
        "UPDATE projects SET name = COALESCE(?3, name), updated_at = datetime('now') \
         WHERE id = ?1 AND user_id = ?2",
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.name)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Ok(None);
    }

    let project = sqlx::query_as::<_, Project>(
        "SELECT id, user_id, name, created_at, updated_at FROM projects WHERE id = ?1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(project)
}

pub async fn delete(pool: &SqlitePool, id: ProjectId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM projects WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
