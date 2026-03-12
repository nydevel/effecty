use axum::extract::{Path, State};
use axum::Json;
use effecty_core::types::{NoteId, UserId};
use sqlx::PgPool;

use crate::error::NotesError;
use db::repo::notes::{self, CreateNote, MoveNote, UpdateNote};

pub async fn get_tree(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<notes::Note>>, NotesError> {
    let tree = notes::get_tree(&pool, user_id).await?;
    Ok(Json(tree))
}

pub async fn get_note(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<NoteId>,
) -> Result<Json<notes::Note>, NotesError> {
    let note = notes::get_by_id(&pool, id, user_id)
        .await?
        .ok_or(NotesError::NotFound)?;
    Ok(Json(note))
}

pub async fn create_note(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateNote>,
) -> Result<Json<notes::Note>, NotesError> {
    if input.node_type != "folder" && input.node_type != "file" {
        return Err(NotesError::BadRequest(
            "node_type must be 'folder' or 'file'".into(),
        ));
    }
    let note = notes::create(&pool, user_id, &input).await?;
    Ok(Json(note))
}

pub async fn update_note(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<NoteId>,
    Json(input): Json<UpdateNote>,
) -> Result<Json<notes::Note>, NotesError> {
    let note = notes::update(&pool, id, user_id, &input)
        .await?
        .ok_or(NotesError::NotFound)?;
    Ok(Json(note))
}

pub async fn move_note(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<NoteId>,
    Json(input): Json<MoveNote>,
) -> Result<Json<notes::Note>, NotesError> {
    let note = notes::move_note(&pool, id, user_id, &input)
        .await?
        .ok_or(NotesError::NotFound)?;
    Ok(Json(note))
}

pub async fn delete_note(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<NoteId>,
) -> Result<axum::http::StatusCode, NotesError> {
    let deleted = notes::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(NotesError::NotFound)
    }
}
