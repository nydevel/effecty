use anyhow::Result;
use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use effecty_core::types::{TaskId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Task {
    pub id: TaskId,
    pub user_id: UserId,
    pub title: String,
    pub content: String,
    pub priority: i16,
    pub task_date: NaiveDate,
    pub time_start: Option<NaiveTime>,
    pub time_end: Option<NaiveTime>,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTask {
    pub title: String,
    pub content: Option<String>,
    pub priority: Option<i16>,
    pub task_date: NaiveDate,
    pub time_start: Option<NaiveTime>,
    pub time_end: Option<NaiveTime>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTask {
    pub title: Option<String>,
    pub content: Option<String>,
    pub priority: Option<i16>,
    pub task_date: Option<NaiveDate>,
    pub time_start: Option<NaiveTime>,
    pub time_end: Option<NaiveTime>,
}

#[derive(Debug, Deserialize)]
pub struct MoveTask {
    pub task_date: NaiveDate,
    pub position: f64,
}

pub async fn get_by_range(
    pool: &PgPool,
    user_id: UserId,
    from: NaiveDate,
    to: NaiveDate,
) -> Result<Vec<Task>> {
    let tasks = sqlx::query_as::<_, Task>(
        r#"
        SELECT * FROM tasks
        WHERE user_id = $1 AND task_date >= $2 AND task_date <= $3
        ORDER BY task_date, position, time_start NULLS LAST
        "#,
    )
    .bind(user_id)
    .bind(from)
    .bind(to)
    .fetch_all(pool)
    .await?;

    Ok(tasks)
}

pub async fn get_by_id(pool: &PgPool, id: TaskId, user_id: UserId) -> Result<Option<Task>> {
    let task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(task)
}

pub async fn create(pool: &PgPool, user_id: UserId, input: &CreateTask) -> Result<Task> {
    let max_pos = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(position) FROM tasks WHERE user_id = $1 AND task_date = $2",
    )
    .bind(user_id)
    .bind(input.task_date)
    .fetch_one(pool)
    .await?;

    let position = max_pos.unwrap_or(0.0) + 1.0;

    let task = sqlx::query_as::<_, Task>(
        r#"
        INSERT INTO tasks (user_id, title, content, priority, task_date, time_start, time_end, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(&input.title)
    .bind(input.content.as_deref().unwrap_or(""))
    .bind(input.priority.unwrap_or(0))
    .bind(input.task_date)
    .bind(input.time_start)
    .bind(input.time_end)
    .bind(position)
    .fetch_one(pool)
    .await?;

    Ok(task)
}

pub async fn update(
    pool: &PgPool,
    id: TaskId,
    user_id: UserId,
    input: &UpdateTask,
) -> Result<Option<Task>> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks
        SET title = COALESCE($3, title),
            content = COALESCE($4, content),
            priority = COALESCE($5, priority),
            task_date = COALESCE($6, task_date),
            time_start = CASE WHEN $7 THEN $8 ELSE time_start END,
            time_end = CASE WHEN $9 THEN $10 ELSE time_end END,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.title)
    .bind(&input.content)
    .bind(input.priority)
    .bind(input.task_date)
    .bind(input.time_start.is_some())
    .bind(input.time_start)
    .bind(input.time_end.is_some())
    .bind(input.time_end)
    .fetch_optional(pool)
    .await?;

    Ok(task)
}

pub async fn move_task(
    pool: &PgPool,
    id: TaskId,
    user_id: UserId,
    input: &MoveTask,
) -> Result<Option<Task>> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks
        SET task_date = $3,
            position = $4,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.task_date)
    .bind(input.position)
    .fetch_optional(pool)
    .await?;

    Ok(task)
}

pub async fn delete(pool: &PgPool, id: TaskId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM tasks WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
