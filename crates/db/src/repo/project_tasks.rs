use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{ProjectId, ProjectTaskId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct ProjectTask {
    pub id: ProjectTaskId,
    pub project_id: ProjectId,
    pub user_id: UserId,
    pub title: String,
    pub description: String,
    pub status: String,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProjectTask {
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectTask {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
}

pub async fn list(
    pool: &SqlitePool,
    project_id: ProjectId,
    user_id: UserId,
) -> Result<Vec<ProjectTask>> {
    let tasks = sqlx::query_as::<_, ProjectTask>(
        "SELECT id, project_id, user_id, title, description, status, position, \
                created_at, updated_at \
         FROM project_tasks \
         WHERE project_id = ?1 AND user_id = ?2 \
         ORDER BY CASE WHEN status = 'done' THEN 1 ELSE 0 END, position, created_at",
    )
    .bind(project_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(tasks)
}

pub async fn get(
    pool: &SqlitePool,
    id: ProjectTaskId,
    user_id: UserId,
) -> Result<Option<ProjectTask>> {
    let task = sqlx::query_as::<_, ProjectTask>(
        "SELECT id, project_id, user_id, title, description, status, position, \
                created_at, updated_at \
         FROM project_tasks WHERE id = ?1 AND user_id = ?2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(task)
}

pub async fn create(
    pool: &SqlitePool,
    project_id: ProjectId,
    user_id: UserId,
    input: &CreateProjectTask,
) -> Result<ProjectTask> {
    let id = Uuid::new_v4();

    let max_pos: f64 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(position), 0.0) FROM project_tasks \
         WHERE project_id = ?1 AND user_id = ?2",
    )
    .bind(project_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    sqlx::query(
        "INSERT INTO project_tasks (id, project_id, user_id, title, position) \
         VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(id)
    .bind(project_id)
    .bind(user_id)
    .bind(&input.title)
    .bind(max_pos + 1.0)
    .execute(pool)
    .await?;

    let task = sqlx::query_as::<_, ProjectTask>(
        "SELECT id, project_id, user_id, title, description, status, position, \
                created_at, updated_at \
         FROM project_tasks WHERE id = ?1",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(task)
}

pub async fn update(
    pool: &SqlitePool,
    id: ProjectTaskId,
    user_id: UserId,
    input: &UpdateProjectTask,
) -> Result<Option<ProjectTask>> {
    let result = sqlx::query(
        "UPDATE project_tasks \
         SET title = COALESCE(?3, title), \
             description = COALESCE(?4, description), \
             status = COALESCE(?5, status), \
             updated_at = datetime('now') \
         WHERE id = ?1 AND user_id = ?2",
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.title)
    .bind(&input.description)
    .bind(&input.status)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Ok(None);
    }

    get(pool, id, user_id).await
}

pub async fn delete(pool: &SqlitePool, id: ProjectTaskId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM project_tasks WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn search(
    pool: &SqlitePool,
    project_id: ProjectId,
    user_id: UserId,
    query: &str,
) -> Result<Vec<ProjectTask>> {
    let pattern = format!("%{query}%");
    let tasks = sqlx::query_as::<_, ProjectTask>(
        "SELECT id, project_id, user_id, title, description, status, position, \
                created_at, updated_at \
         FROM project_tasks \
         WHERE project_id = ?1 AND user_id = ?2 AND title LIKE ?3 \
         ORDER BY created_at DESC LIMIT 20",
    )
    .bind(project_id)
    .bind(user_id)
    .bind(&pattern)
    .fetch_all(pool)
    .await?;

    Ok(tasks)
}
