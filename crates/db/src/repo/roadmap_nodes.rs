use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{RoadmapNodeId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct RoadmapNode {
    pub id: RoadmapNodeId,
    pub user_id: UserId,
    pub parent_id: Option<RoadmapNodeId>,
    pub label: String,
    pub position_x: f64,
    pub position_y: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRoadmapNode {
    pub parent_id: Option<RoadmapNodeId>,
    pub label: String,
    pub position_x: f64,
    pub position_y: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRoadmapNode {
    pub label: Option<String>,
    pub position_x: Option<f64>,
    pub position_y: Option<f64>,
    pub parent_id: Option<Option<RoadmapNodeId>>,
}

pub async fn list(pool: &SqlitePool, user_id: UserId) -> Result<Vec<RoadmapNode>> {
    let nodes = sqlx::query_as::<_, RoadmapNode>(
        "SELECT * FROM roadmap_nodes WHERE user_id = ?1 ORDER BY created_at",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(nodes)
}

pub async fn create(
    pool: &SqlitePool,
    user_id: UserId,
    input: &CreateRoadmapNode,
) -> Result<RoadmapNode> {
    let id = Uuid::new_v4();
    let node = sqlx::query_as::<_, RoadmapNode>(
        r#"
        INSERT INTO roadmap_nodes (id, user_id, parent_id, label, position_x, position_y)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.parent_id)
    .bind(&input.label)
    .bind(input.position_x)
    .bind(input.position_y)
    .fetch_one(pool)
    .await?;

    Ok(node)
}

pub async fn update(
    pool: &SqlitePool,
    id: RoadmapNodeId,
    user_id: UserId,
    input: &UpdateRoadmapNode,
) -> Result<Option<RoadmapNode>> {
    let node = sqlx::query_as::<_, RoadmapNode>(
        r#"
        UPDATE roadmap_nodes
        SET label = COALESCE(?3, label),
            position_x = COALESCE(?4, position_x),
            position_y = COALESCE(?5, position_y),
            parent_id = CASE WHEN ?6 THEN ?7 ELSE parent_id END,
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.label)
    .bind(input.position_x)
    .bind(input.position_y)
    .bind(input.parent_id.is_some())
    .bind(input.parent_id.as_ref().and_then(|p| *p))
    .fetch_optional(pool)
    .await?;

    Ok(node)
}

pub async fn delete(pool: &SqlitePool, id: RoadmapNodeId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM roadmap_nodes WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
