use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{ExerciseId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Exercise {
    pub id: ExerciseId,
    pub user_id: UserId,
    pub name: String,
    pub muscle_group: Option<String>,
    pub sort_order: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateExercise {
    pub name: String,
    pub muscle_group: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateExercise {
    pub name: Option<String>,
    pub muscle_group: Option<String>,
}

pub async fn list(pool: &SqlitePool, user_id: UserId) -> Result<Vec<Exercise>> {
    let exercises = sqlx::query_as::<_, Exercise>(
        "SELECT * FROM exercises WHERE user_id = ?1 ORDER BY sort_order",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(exercises)
}

pub async fn get_by_id(
    pool: &SqlitePool,
    id: ExerciseId,
    user_id: UserId,
) -> Result<Option<Exercise>> {
    let exercise =
        sqlx::query_as::<_, Exercise>("SELECT * FROM exercises WHERE id = ?1 AND user_id = ?2")
            .bind(id)
            .bind(user_id)
            .fetch_optional(pool)
            .await?;

    Ok(exercise)
}

pub async fn find_or_create_by_name(
    pool: &SqlitePool,
    user_id: UserId,
    name: &str,
) -> Result<Exercise> {
    let existing =
        sqlx::query_as::<_, Exercise>("SELECT * FROM exercises WHERE user_id = ?1 AND name = ?2")
            .bind(user_id)
            .bind(name)
            .fetch_optional(pool)
            .await?;

    if let Some(exercise) = existing {
        return Ok(exercise);
    }

    create(
        pool,
        user_id,
        &CreateExercise {
            name: name.to_owned(),
            muscle_group: None,
        },
    )
    .await
}

pub async fn create(
    pool: &SqlitePool,
    user_id: UserId,
    input: &CreateExercise,
) -> Result<Exercise> {
    let max_pos = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(sort_order) FROM exercises WHERE user_id = ?1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let sort_order = max_pos.unwrap_or(0.0) + 1.0;

    let id = Uuid::new_v4();
    let exercise = sqlx::query_as::<_, Exercise>(
        r#"
        INSERT INTO exercises (id, user_id, name, muscle_group, sort_order)
        VALUES (?1, ?2, ?3, ?4, ?5)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.name)
    .bind(&input.muscle_group)
    .bind(sort_order)
    .fetch_one(pool)
    .await?;

    Ok(exercise)
}

pub async fn update(
    pool: &SqlitePool,
    id: ExerciseId,
    user_id: UserId,
    input: &UpdateExercise,
) -> Result<Option<Exercise>> {
    let exercise = sqlx::query_as::<_, Exercise>(
        r#"
        UPDATE exercises
        SET name = COALESCE(?3, name),
            muscle_group = COALESCE(?4, muscle_group),
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.name)
    .bind(&input.muscle_group)
    .fetch_optional(pool)
    .await?;

    Ok(exercise)
}

pub async fn delete(pool: &SqlitePool, id: ExerciseId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM exercises WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
