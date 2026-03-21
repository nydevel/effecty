use axum::extract::{Path, Query, State};
use axum::Json;
use chrono::NaiveDate;
use effecty_core::types::{TaskId, UserId};
use serde::Deserialize;
use sqlx::SqlitePool;

use crate::error::TasksError;
use db::repo::tasks::{self, CreateTask, MoveTask, UpdateTask};

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub from: NaiveDate,
    pub to: NaiveDate,
}

pub async fn list_tasks(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Query(query): Query<ListQuery>,
) -> Result<Json<Vec<tasks::Task>>, TasksError> {
    let list = tasks::get_by_range(&pool, user_id, query.from, query.to).await?;
    Ok(Json(list))
}

pub async fn get_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<TaskId>,
) -> Result<Json<tasks::Task>, TasksError> {
    let task = tasks::get_by_id(&pool, id, user_id)
        .await?
        .ok_or(TasksError::NotFound)?;
    Ok(Json(task))
}

pub async fn create_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateTask>,
) -> Result<Json<tasks::Task>, TasksError> {
    if let Some(p) = input.priority {
        if !(0..=3).contains(&p) {
            return Err(TasksError::BadRequest("priority must be 0..3".into()));
        }
    }
    let task = tasks::create(&pool, user_id, &input).await?;
    Ok(Json(task))
}

pub async fn update_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<TaskId>,
    Json(input): Json<UpdateTask>,
) -> Result<Json<tasks::Task>, TasksError> {
    let task = tasks::update(&pool, id, user_id, &input)
        .await?
        .ok_or(TasksError::NotFound)?;
    Ok(Json(task))
}

pub async fn move_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<TaskId>,
    Json(input): Json<MoveTask>,
) -> Result<Json<tasks::Task>, TasksError> {
    let task = tasks::move_task(&pool, id, user_id, &input)
        .await?
        .ok_or(TasksError::NotFound)?;
    Ok(Json(task))
}

pub async fn delete_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<TaskId>,
) -> Result<axum::http::StatusCode, TasksError> {
    let deleted = tasks::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(TasksError::NotFound)
    }
}
