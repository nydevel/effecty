use axum::extract::{Path, State};
use axum::Json;
use effecty_core::types::{NoteId, UserId};

use crate::app_state::AppState;
use crate::error::AppError;
use db::repo::notes::{self, CreateNote, MoveNote, UpdateNote};

pub async fn get_tree(
    State(state): State<AppState>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<notes::Note>>, AppError> {
    let tree = notes::get_tree(&state.pool, user_id).await?;
    Ok(Json(tree))
}

pub async fn get_note(
    State(state): State<AppState>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<NoteId>,
) -> Result<Json<notes::Note>, AppError> {
    let note = notes::get_by_id(&state.pool, id, user_id)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(note))
}

pub async fn create_note(
    State(state): State<AppState>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateNote>,
) -> Result<Json<notes::Note>, AppError> {
    if input.node_type != "folder" && input.node_type != "file" {
        return Err(AppError::BadRequest("node_type must be 'folder' or 'file'".into()));
    }
    let note = notes::create(&state.pool, user_id, &input).await?;
    Ok(Json(note))
}

pub async fn update_note(
    State(state): State<AppState>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<NoteId>,
    Json(input): Json<UpdateNote>,
) -> Result<Json<notes::Note>, AppError> {
    let note = notes::update(&state.pool, id, user_id, &input)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(note))
}

pub async fn move_note(
    State(state): State<AppState>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<NoteId>,
    Json(input): Json<MoveNote>,
) -> Result<Json<notes::Note>, AppError> {
    let note = notes::move_note(&state.pool, id, user_id, &input)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(note))
}

pub async fn delete_note(
    State(state): State<AppState>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<NoteId>,
) -> Result<axum::http::StatusCode, AppError> {
    let deleted = notes::delete(&state.pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}
