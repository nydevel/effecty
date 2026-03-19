use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{MemoId, NoteId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Memo {
    pub id: MemoId,
    pub note_id: NoteId,
    pub user_id: UserId,
    pub title: String,
    pub content: String,
    pub sort_order: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemo {
    pub title: String,
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemo {
    pub title: Option<String>,
    pub content: Option<String>,
}

pub async fn list(pool: &PgPool, note_id: NoteId, user_id: UserId) -> Result<Vec<Memo>> {
    let memos = sqlx::query_as::<_, Memo>(
        "SELECT * FROM memos WHERE note_id = $1 AND user_id = $2 ORDER BY sort_order, created_at",
    )
    .bind(note_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(memos)
}

pub async fn get(pool: &PgPool, id: MemoId, user_id: UserId) -> Result<Option<Memo>> {
    let memo = sqlx::query_as::<_, Memo>("SELECT * FROM memos WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    Ok(memo)
}

pub async fn create(
    pool: &PgPool,
    note_id: NoteId,
    user_id: UserId,
    input: &CreateMemo,
) -> Result<Memo> {
    let max_sort = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(sort_order) FROM memos WHERE note_id = $1 AND user_id = $2",
    )
    .bind(note_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let sort_order = max_sort.unwrap_or(0.0) + 1.0;

    let memo = sqlx::query_as::<_, Memo>(
        r#"
        INSERT INTO memos (note_id, user_id, title, content, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#,
    )
    .bind(note_id)
    .bind(user_id)
    .bind(&input.title)
    .bind(input.content.as_deref().unwrap_or(""))
    .bind(sort_order)
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

pub async fn update(
    pool: &PgPool,
    id: MemoId,
    user_id: UserId,
    input: &UpdateMemo,
) -> Result<Option<Memo>> {
    let memo = sqlx::query_as::<_, Memo>(
        r#"
        UPDATE memos
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

    Ok(memo)
}

pub async fn reorder(pool: &PgPool, user_id: UserId, ids: &[MemoId]) -> Result<()> {
    let mut tx = pool.begin().await?;
    #[allow(clippy::needless_range_loop)]
    'update: for i in 0..ids.len() {
        sqlx::query(
            "UPDATE memos SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
        )
        .bind(i as f64)
        .bind(ids[i])
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
        if i == ids.len() - 1 {
            break 'update;
        }
    }
    tx.commit().await?;
    Ok(())
}

pub async fn delete(pool: &PgPool, id: MemoId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM memos WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
