use axum::extract::{Path, State};
use axum::Json;
use effecty_core::types::{ThoughtCommentId, ThoughtId, UserId};
use sqlx::SqlitePool;

use crate::error::ThoughtsError;
use db::repo::thought_comments::{self, CreateComment};
use db::repo::thoughts::{self, CreateThought, UpdateThought};

// --- Thoughts ---

pub async fn list_thoughts(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<thoughts::Thought>>, ThoughtsError> {
    let list = thoughts::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_thought(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateThought>,
) -> Result<Json<thoughts::Thought>, ThoughtsError> {
    let thought = thoughts::create(&pool, user_id, &input).await?;
    Ok(Json(thought))
}

pub async fn update_thought(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<ThoughtId>,
    Json(input): Json<UpdateThought>,
) -> Result<Json<thoughts::Thought>, ThoughtsError> {
    let thought = thoughts::update(&pool, id, user_id, &input)
        .await?
        .ok_or(ThoughtsError::NotFound)?;
    Ok(Json(thought))
}

pub async fn delete_thought(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<ThoughtId>,
) -> Result<axum::http::StatusCode, ThoughtsError> {
    let deleted = thoughts::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(ThoughtsError::NotFound)
    }
}

// --- Thought Comments ---

pub async fn list_comments(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(thought_id): Path<ThoughtId>,
) -> Result<Json<Vec<thought_comments::ThoughtComment>>, ThoughtsError> {
    let list = thought_comments::list(&pool, thought_id, user_id).await?;
    Ok(Json(list))
}

pub async fn create_comment(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(thought_id): Path<ThoughtId>,
    Json(input): Json<CreateComment>,
) -> Result<Json<thought_comments::ThoughtComment>, ThoughtsError> {
    // Verify thought belongs to user
    thoughts::get(&pool, thought_id, user_id)
        .await?
        .ok_or(ThoughtsError::NotFound)?;

    let comment = thought_comments::create(&pool, thought_id, user_id, &input).await?;
    Ok(Json(comment))
}

pub async fn delete_comment(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_thought_id, comment_id)): Path<(ThoughtId, ThoughtCommentId)>,
) -> Result<axum::http::StatusCode, ThoughtsError> {
    let deleted = thought_comments::delete(&pool, comment_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(ThoughtsError::NotFound)
    }
}
