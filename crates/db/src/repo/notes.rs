use anyhow::Result;
use effecty_core::types::{NoteId, UserId};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Note {
    pub id: NoteId,
    pub user_id: UserId,
    pub parent_id: Option<NoteId>,
    pub title: String,
    pub content: String,
    pub node_type: String,
    pub sort_order: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateNote {
    pub parent_id: Option<NoteId>,
    pub title: String,
    pub node_type: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNote {
    pub title: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MoveNote {
    pub parent_id: Option<NoteId>,
    pub sort_order: f64,
}

pub async fn get_tree(pool: &PgPool, user_id: UserId) -> Result<Vec<Note>> {
    let notes = sqlx::query_as::<_, Note>(
        r#"
        WITH RECURSIVE tree AS (
            SELECT * FROM notes WHERE user_id = $1 AND parent_id IS NULL
            UNION ALL
            SELECT n.* FROM notes n
            JOIN tree t ON n.parent_id = t.id
        )
        SELECT * FROM tree ORDER BY parent_id NULLS FIRST, sort_order
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(notes)
}

pub async fn get_by_id(pool: &PgPool, id: NoteId, user_id: UserId) -> Result<Option<Note>> {
    let note = sqlx::query_as::<_, Note>(
        "SELECT * FROM notes WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(note)
}

pub async fn create(pool: &PgPool, user_id: UserId, input: &CreateNote) -> Result<Note> {
    let max_sort = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(sort_order) FROM notes WHERE user_id = $1 AND parent_id IS NOT DISTINCT FROM $2",
    )
    .bind(user_id)
    .bind(input.parent_id)
    .fetch_one(pool)
    .await?;

    let sort_order = max_sort.unwrap_or(0.0) + 1.0;

    let note = sqlx::query_as::<_, Note>(
        r#"
        INSERT INTO notes (user_id, parent_id, title, node_type, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(input.parent_id)
    .bind(&input.title)
    .bind(&input.node_type)
    .bind(sort_order)
    .fetch_one(pool)
    .await?;

    Ok(note)
}

pub async fn update(pool: &PgPool, id: NoteId, user_id: UserId, input: &UpdateNote) -> Result<Option<Note>> {
    let note = sqlx::query_as::<_, Note>(
        r#"
        UPDATE notes
        SET title = COALESCE($3, title),
            content = COALESCE($4, content),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.title)
    .bind(&input.content)
    .fetch_optional(pool)
    .await?;

    Ok(note)
}

pub async fn move_note(pool: &PgPool, id: NoteId, user_id: UserId, input: &MoveNote) -> Result<Option<Note>> {
    let note = sqlx::query_as::<_, Note>(
        r#"
        UPDATE notes
        SET parent_id = $3,
            sort_order = $4,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.parent_id)
    .bind(input.sort_order)
    .fetch_optional(pool)
    .await?;

    Ok(note)
}

pub async fn delete(pool: &PgPool, id: NoteId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM notes WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
