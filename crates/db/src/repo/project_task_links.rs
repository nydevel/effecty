use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{ProjectTaskId, ProjectTaskLinkId, UserId};
use serde::Serialize;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct ProjectTaskLink {
    pub id: ProjectTaskLinkId,
    pub source_task_id: ProjectTaskId,
    pub target_task_id: ProjectTaskId,
    pub link_type: String,
    pub target_title: String,
    pub created_at: DateTime<Utc>,
}

pub async fn list(
    pool: &SqlitePool,
    source_id: ProjectTaskId,
    user_id: UserId,
) -> Result<Vec<ProjectTaskLink>> {
    let links = sqlx::query_as::<_, ProjectTaskLink>(
        "SELECT ptl.id, ptl.source_task_id, ptl.target_task_id, ptl.link_type, \
                pt.title AS target_title, ptl.created_at \
         FROM project_task_links ptl \
         JOIN project_tasks pt ON pt.id = ptl.target_task_id \
         WHERE ptl.source_task_id = ?1 AND ptl.user_id = ?2 \
         ORDER BY ptl.created_at DESC",
    )
    .bind(source_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(links)
}

pub async fn link(
    pool: &SqlitePool,
    source_id: ProjectTaskId,
    target_id: ProjectTaskId,
    link_type: &str,
    user_id: UserId,
) -> Result<Option<ProjectTaskLink>> {
    if source_id == target_id {
        return Ok(None);
    }

    let id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO project_task_links (id, source_task_id, target_task_id, link_type, user_id) \
         VALUES (?1, ?2, ?3, ?4, ?5) \
         ON CONFLICT (source_task_id, target_task_id) DO UPDATE SET link_type = ?4",
    )
    .bind(id)
    .bind(source_id)
    .bind(target_id)
    .bind(link_type)
    .bind(user_id)
    .execute(pool)
    .await?;

    let link = sqlx::query_as::<_, ProjectTaskLink>(
        "SELECT ptl.id, ptl.source_task_id, ptl.target_task_id, ptl.link_type, \
                pt.title AS target_title, ptl.created_at \
         FROM project_task_links ptl \
         JOIN project_tasks pt ON pt.id = ptl.target_task_id \
         WHERE ptl.source_task_id = ?1 AND ptl.target_task_id = ?2",
    )
    .bind(source_id)
    .bind(target_id)
    .fetch_optional(pool)
    .await?;

    Ok(link)
}

pub async fn unlink(
    pool: &SqlitePool,
    source_id: ProjectTaskId,
    target_id: ProjectTaskId,
    user_id: UserId,
) -> Result<bool> {
    let result = sqlx::query(
        "DELETE FROM project_task_links \
         WHERE source_task_id = ?1 AND target_task_id = ?2 AND user_id = ?3",
    )
    .bind(source_id)
    .bind(target_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
