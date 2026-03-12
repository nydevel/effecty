use axum::extract::{Path, State};
use axum::Json;
use effecty_core::types::{TagId, ThoughtCommentId, ThoughtId, UserId};
use sqlx::PgPool;

use crate::error::ThoughtsError;
use db::repo::tags::{self, CreateTag};
use db::repo::thought_comments::{self, CreateComment};
use db::repo::thought_tags::{self, LinkTag};
use db::repo::thoughts::{self, CreateThought, MoveThought, UpdateThought};

// --- Thoughts ---

pub async fn list_thoughts(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<thoughts::Thought>>, ThoughtsError> {
    let list = thoughts::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_thought(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateThought>,
) -> Result<Json<thoughts::Thought>, ThoughtsError> {
    let thought = thoughts::create(&pool, user_id, &input).await?;
    Ok(Json(thought))
}

pub async fn update_thought(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<ThoughtId>,
    Json(input): Json<UpdateThought>,
) -> Result<Json<thoughts::Thought>, ThoughtsError> {
    let thought = thoughts::update(&pool, id, user_id, &input)
        .await?
        .ok_or(ThoughtsError::NotFound)?;
    Ok(Json(thought))
}

pub async fn move_thought(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<ThoughtId>,
    Json(input): Json<MoveThought>,
) -> Result<Json<thoughts::Thought>, ThoughtsError> {
    let thought = thoughts::move_thought(&pool, id, user_id, &input)
        .await?
        .ok_or(ThoughtsError::NotFound)?;
    Ok(Json(thought))
}

pub async fn delete_thought(
    State(pool): State<PgPool>,
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

// --- Tags ---

pub async fn list_tags(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<tags::Tag>>, ThoughtsError> {
    let list = tags::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_tag(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateTag>,
) -> Result<Json<tags::Tag>, ThoughtsError> {
    let tag = tags::create(&pool, user_id, &input).await?;
    Ok(Json(tag))
}

pub async fn delete_tag(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<TagId>,
) -> Result<axum::http::StatusCode, ThoughtsError> {
    let deleted = tags::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(ThoughtsError::NotFound)
    }
}

// --- Thought Tags ---

pub async fn list_thought_tags(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(thought_id): Path<ThoughtId>,
) -> Result<Json<Vec<thought_tags::ThoughtTag>>, ThoughtsError> {
    let list = thought_tags::list(&pool, thought_id, user_id).await?;
    Ok(Json(list))
}

pub async fn link_tag(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(thought_id): Path<ThoughtId>,
    Json(input): Json<LinkTag>,
) -> Result<Json<thought_tags::ThoughtTag>, ThoughtsError> {
    let tt = thought_tags::link(&pool, thought_id, input.tag_id, user_id)
        .await?
        .ok_or(ThoughtsError::NotFound)?;
    Ok(Json(tt))
}

pub async fn unlink_tag(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((thought_id, tag_id)): Path<(ThoughtId, TagId)>,
) -> Result<axum::http::StatusCode, ThoughtsError> {
    let deleted = thought_tags::unlink(&pool, thought_id, tag_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(ThoughtsError::NotFound)
    }
}

// --- Thought Comments ---

pub async fn list_comments(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(thought_id): Path<ThoughtId>,
) -> Result<Json<Vec<thought_comments::ThoughtComment>>, ThoughtsError> {
    let list = thought_comments::list(&pool, thought_id, user_id).await?;
    Ok(Json(list))
}

pub async fn create_comment(
    State(pool): State<PgPool>,
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
    State(pool): State<PgPool>,
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
