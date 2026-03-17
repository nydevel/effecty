use axum::extract::{Path, State};
use axum::Json;
use effecty_core::types::{MemoId, NoteId, UserId};
use sqlx::PgPool;

use crate::error::NotesError;
use db::repo::memos::{self, CreateMemo, UpdateMemo};
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
    if !matches!(input.node_type.as_str(), "folder" | "file" | "memolist") {
        return Err(NotesError::BadRequest(
            "node_type must be 'folder', 'file', or 'memolist'".into(),
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

// --- Memos ---

pub async fn list_memos(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(note_id): Path<NoteId>,
) -> Result<Json<Vec<memos::Memo>>, NotesError> {
    let list = memos::list(&pool, note_id, user_id).await?;
    Ok(Json(list))
}

pub async fn create_memo(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(note_id): Path<NoteId>,
    Json(input): Json<CreateMemo>,
) -> Result<Json<memos::Memo>, NotesError> {
    let memo = memos::create(&pool, note_id, user_id, &input).await?;
    Ok(Json(memo))
}

pub async fn update_memo(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_note_id, memo_id)): Path<(NoteId, MemoId)>,
    Json(input): Json<UpdateMemo>,
) -> Result<Json<memos::Memo>, NotesError> {
    let memo = memos::update(&pool, memo_id, user_id, &input)
        .await?
        .ok_or(NotesError::NotFound)?;
    Ok(Json(memo))
}

pub async fn delete_memo(
    State(pool): State<PgPool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_note_id, memo_id)): Path<(NoteId, MemoId)>,
) -> Result<axum::http::StatusCode, NotesError> {
    let deleted = memos::delete(&pool, memo_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(NotesError::NotFound)
    }
}
