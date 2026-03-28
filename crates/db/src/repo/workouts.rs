use anyhow::Result;
use chrono::{DateTime, NaiveDate, Utc};
use effecty_core::types::{ExerciseId, UserId, WorkoutExerciseId, WorkoutId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Workout {
    pub id: WorkoutId,
    pub user_id: UserId,
    pub workout_date: NaiveDate,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct WorkoutExerciseWithName {
    pub id: WorkoutExerciseId,
    pub workout_id: WorkoutId,
    pub exercise_id: ExerciseId,
    pub exercise_name: String,
    pub sets: String,
    pub reps: String,
    pub weight: String,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkout {
    pub workout_date: NaiveDate,
}

#[derive(Debug, Deserialize)]
pub struct DuplicateWorkout {
    pub workout_date: NaiveDate,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWorkout {
    pub workout_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct MoveWorkout {
    pub position: f64,
}

#[derive(Debug, Deserialize)]
pub struct AddExercise {
    pub exercise_name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWorkoutExercise {
    pub sets: Option<String>,
    pub reps: Option<String>,
    pub weight: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MoveWorkoutExercise {
    pub position: f64,
}

#[derive(Debug, sqlx::FromRow)]
struct WorkoutExerciseCopy {
    exercise_id: ExerciseId,
    sets: String,
    reps: String,
    weight: String,
    position: f64,
}

pub async fn list_workouts(pool: &SqlitePool, user_id: UserId) -> Result<Vec<Workout>> {
    let workouts =
        sqlx::query_as::<_, Workout>("SELECT * FROM workouts WHERE user_id = ?1 ORDER BY position")
            .bind(user_id)
            .fetch_all(pool)
            .await?;

    Ok(workouts)
}

pub async fn get_workout(
    pool: &SqlitePool,
    id: WorkoutId,
    user_id: UserId,
) -> Result<Option<Workout>> {
    let workout =
        sqlx::query_as::<_, Workout>("SELECT * FROM workouts WHERE id = ?1 AND user_id = ?2")
            .bind(id)
            .bind(user_id)
            .fetch_optional(pool)
            .await?;

    Ok(workout)
}

pub async fn create_workout(
    pool: &SqlitePool,
    user_id: UserId,
    input: &CreateWorkout,
) -> Result<Workout> {
    let max_pos = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(position) FROM workouts WHERE user_id = ?1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let position = max_pos.unwrap_or(0.0) + 1.0;

    let id = Uuid::new_v4();
    let workout = sqlx::query_as::<_, Workout>(
        r#"
        INSERT INTO workouts (id, user_id, workout_date, position)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.workout_date)
    .bind(position)
    .fetch_one(pool)
    .await?;

    Ok(workout)
}

pub async fn move_workout(
    pool: &SqlitePool,
    id: WorkoutId,
    user_id: UserId,
    input: &MoveWorkout,
) -> Result<Option<Workout>> {
    let workout = sqlx::query_as::<_, Workout>(
        r#"
        UPDATE workouts
        SET position = ?3,
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.position)
    .fetch_optional(pool)
    .await?;

    Ok(workout)
}

pub async fn duplicate_workout(
    pool: &SqlitePool,
    id: WorkoutId,
    user_id: UserId,
    input: &DuplicateWorkout,
) -> Result<Option<Workout>> {
    let mut tx = pool.begin().await?;

    let source_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(1) FROM workouts WHERE id = ?1 AND user_id = ?2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await?;

    if source_exists == 0 {
        return Ok(None);
    }

    let max_pos = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(position) FROM workouts WHERE user_id = ?1",
    )
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await?;

    let position = max_pos.unwrap_or(0.0) + 1.0;
    let new_workout_id = Uuid::new_v4();

    let workout = sqlx::query_as::<_, Workout>(
        r#"
        INSERT INTO workouts (id, user_id, workout_date, position)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING *
        "#,
    )
    .bind(new_workout_id)
    .bind(user_id)
    .bind(input.workout_date)
    .bind(position)
    .fetch_one(&mut *tx)
    .await?;

    let exercises = sqlx::query_as::<_, WorkoutExerciseCopy>(
        r#"
        SELECT exercise_id, sets, reps, weight, position
        FROM workout_exercises
        WHERE workout_id = ?1
        ORDER BY position
        "#,
    )
    .bind(id)
    .fetch_all(&mut *tx)
    .await?;

    for exercise in exercises {
        sqlx::query(
            r#"
            INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, weight, position)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(new_workout_id)
        .bind(exercise.exercise_id)
        .bind(exercise.sets)
        .bind(exercise.reps)
        .bind(exercise.weight)
        .bind(exercise.position)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Some(workout))
}

pub async fn update_workout(
    pool: &SqlitePool,
    id: WorkoutId,
    user_id: UserId,
    input: &UpdateWorkout,
) -> Result<Option<Workout>> {
    let workout = sqlx::query_as::<_, Workout>(
        r#"
        UPDATE workouts
        SET workout_date = COALESCE(?3, workout_date),
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.workout_date)
    .fetch_optional(pool)
    .await?;

    Ok(workout)
}

pub async fn delete_workout(pool: &SqlitePool, id: WorkoutId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM workouts WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn list_workout_exercises(
    pool: &SqlitePool,
    workout_id: WorkoutId,
    user_id: UserId,
) -> Result<Vec<WorkoutExerciseWithName>> {
    let exercises = sqlx::query_as::<_, WorkoutExerciseWithName>(
        r#"
        SELECT we.id, we.workout_id, we.exercise_id, e.name AS exercise_name,
               we.sets, we.reps, we.weight, we.position, we.created_at, we.updated_at
        FROM workout_exercises we
        JOIN exercises e ON e.id = we.exercise_id
        JOIN workouts w ON w.id = we.workout_id
        WHERE we.workout_id = ?1 AND w.user_id = ?2
        ORDER BY we.position
        "#,
    )
    .bind(workout_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(exercises)
}

pub async fn add_exercise(
    pool: &SqlitePool,
    workout_id: WorkoutId,
    exercise_id: ExerciseId,
) -> Result<WorkoutExerciseWithName> {
    let max_pos = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(position) FROM workout_exercises WHERE workout_id = ?1",
    )
    .bind(workout_id)
    .fetch_one(pool)
    .await?;

    let position = max_pos.unwrap_or(0.0) + 1.0;

    let id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO workout_exercises (id, workout_id, exercise_id, position)
        VALUES (?1, ?2, ?3, ?4)
        "#,
    )
    .bind(id)
    .bind(workout_id)
    .bind(exercise_id)
    .bind(position)
    .execute(pool)
    .await?;

    let we = sqlx::query_as::<_, WorkoutExerciseWithName>(
        r#"
        SELECT we.id, we.workout_id, we.exercise_id, e.name AS exercise_name,
               we.sets, we.reps, we.weight, we.position, we.created_at, we.updated_at
        FROM workout_exercises we
        JOIN exercises e ON e.id = we.exercise_id
        WHERE we.id = ?1
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(we)
}

pub async fn update_exercise_stats(
    pool: &SqlitePool,
    we_id: WorkoutExerciseId,
    workout_id: WorkoutId,
    user_id: UserId,
    input: &UpdateWorkoutExercise,
) -> Result<Option<WorkoutExerciseWithName>> {
    let result = sqlx::query(
        r#"
        UPDATE workout_exercises
        SET sets = COALESCE(?4, sets),
            reps = COALESCE(?5, reps),
            weight = COALESCE(?6, weight),
            updated_at = datetime('now')
        WHERE id = ?1 AND workout_id = ?2
              AND EXISTS(SELECT 1 FROM workouts WHERE id = ?2 AND user_id = ?3)
        "#,
    )
    .bind(we_id)
    .bind(workout_id)
    .bind(user_id)
    .bind(&input.sets)
    .bind(&input.reps)
    .bind(&input.weight)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Ok(None);
    }

    let we = sqlx::query_as::<_, WorkoutExerciseWithName>(
        r#"
        SELECT we.id, we.workout_id, we.exercise_id, e.name AS exercise_name,
               we.sets, we.reps, we.weight, we.position, we.created_at, we.updated_at
        FROM workout_exercises we
        JOIN exercises e ON e.id = we.exercise_id
        WHERE we.id = ?1
        "#,
    )
    .bind(we_id)
    .fetch_optional(pool)
    .await?;

    Ok(we)
}

pub async fn move_exercise(
    pool: &SqlitePool,
    we_id: WorkoutExerciseId,
    workout_id: WorkoutId,
    user_id: UserId,
    input: &MoveWorkoutExercise,
) -> Result<Option<WorkoutExerciseWithName>> {
    let result = sqlx::query(
        r#"
        UPDATE workout_exercises
        SET position = ?4,
            updated_at = datetime('now')
        WHERE id = ?1 AND workout_id = ?2
              AND EXISTS(SELECT 1 FROM workouts WHERE id = ?2 AND user_id = ?3)
        "#,
    )
    .bind(we_id)
    .bind(workout_id)
    .bind(user_id)
    .bind(input.position)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Ok(None);
    }

    let we = sqlx::query_as::<_, WorkoutExerciseWithName>(
        r#"
        SELECT we.id, we.workout_id, we.exercise_id, e.name AS exercise_name,
               we.sets, we.reps, we.weight, we.position, we.created_at, we.updated_at
        FROM workout_exercises we
        JOIN exercises e ON e.id = we.exercise_id
        WHERE we.id = ?1
        "#,
    )
    .bind(we_id)
    .fetch_optional(pool)
    .await?;

    Ok(we)
}

pub async fn remove_exercise(
    pool: &SqlitePool,
    we_id: WorkoutExerciseId,
    workout_id: WorkoutId,
    user_id: UserId,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        DELETE FROM workout_exercises
        WHERE id = ?1 AND workout_id = ?2
              AND EXISTS(SELECT 1 FROM workouts WHERE id = ?2 AND user_id = ?3)
        "#,
    )
    .bind(we_id)
    .bind(workout_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
