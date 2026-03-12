use anyhow::Result;
use chrono::{DateTime, NaiveDate, Utc};
use effecty_core::types::{ExerciseId, UserId, WorkoutExerciseId, WorkoutId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

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

pub async fn list_workouts(pool: &PgPool, user_id: UserId) -> Result<Vec<Workout>> {
    let workouts =
        sqlx::query_as::<_, Workout>("SELECT * FROM workouts WHERE user_id = $1 ORDER BY position")
            .bind(user_id)
            .fetch_all(pool)
            .await?;

    Ok(workouts)
}

pub async fn get_workout(pool: &PgPool, id: WorkoutId, user_id: UserId) -> Result<Option<Workout>> {
    let workout =
        sqlx::query_as::<_, Workout>("SELECT * FROM workouts WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .fetch_optional(pool)
            .await?;

    Ok(workout)
}

pub async fn create_workout(
    pool: &PgPool,
    user_id: UserId,
    input: &CreateWorkout,
) -> Result<Workout> {
    let max_pos = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(position) FROM workouts WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let position = max_pos.unwrap_or(0.0) + 1.0;

    let workout = sqlx::query_as::<_, Workout>(
        r#"
        INSERT INTO workouts (user_id, workout_date, position)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(input.workout_date)
    .bind(position)
    .fetch_one(pool)
    .await?;

    Ok(workout)
}

pub async fn move_workout(
    pool: &PgPool,
    id: WorkoutId,
    user_id: UserId,
    input: &MoveWorkout,
) -> Result<Option<Workout>> {
    let workout = sqlx::query_as::<_, Workout>(
        r#"
        UPDATE workouts
        SET position = $3,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
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

pub async fn update_workout(
    pool: &PgPool,
    id: WorkoutId,
    user_id: UserId,
    input: &UpdateWorkout,
) -> Result<Option<Workout>> {
    let workout = sqlx::query_as::<_, Workout>(
        r#"
        UPDATE workouts
        SET workout_date = COALESCE($3, workout_date),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
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

pub async fn delete_workout(pool: &PgPool, id: WorkoutId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM workouts WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn list_workout_exercises(
    pool: &PgPool,
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
        WHERE we.workout_id = $1 AND w.user_id = $2
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
    pool: &PgPool,
    workout_id: WorkoutId,
    exercise_id: ExerciseId,
) -> Result<WorkoutExerciseWithName> {
    let max_pos = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(position) FROM workout_exercises WHERE workout_id = $1",
    )
    .bind(workout_id)
    .fetch_one(pool)
    .await?;

    let position = max_pos.unwrap_or(0.0) + 1.0;

    let we = sqlx::query_as::<_, WorkoutExerciseWithName>(
        r#"
        INSERT INTO workout_exercises (workout_id, exercise_id, position)
        VALUES ($1, $2, $3)
        RETURNING id, workout_id, exercise_id,
                  (SELECT name FROM exercises WHERE id = $2) AS exercise_name,
                  sets, reps, weight, position, created_at, updated_at
        "#,
    )
    .bind(workout_id)
    .bind(exercise_id)
    .bind(position)
    .fetch_one(pool)
    .await?;

    Ok(we)
}

pub async fn update_exercise_stats(
    pool: &PgPool,
    we_id: WorkoutExerciseId,
    workout_id: WorkoutId,
    user_id: UserId,
    input: &UpdateWorkoutExercise,
) -> Result<Option<WorkoutExerciseWithName>> {
    let we = sqlx::query_as::<_, WorkoutExerciseWithName>(
        r#"
        UPDATE workout_exercises we
        SET sets = COALESCE($4, we.sets),
            reps = COALESCE($5, we.reps),
            weight = COALESCE($6, we.weight),
            updated_at = NOW()
        FROM workouts w, exercises e
        WHERE we.id = $1 AND we.workout_id = $2 AND w.id = we.workout_id
              AND w.user_id = $3 AND e.id = we.exercise_id
        RETURNING we.id, we.workout_id, we.exercise_id, e.name AS exercise_name,
                  we.sets, we.reps, we.weight, we.position, we.created_at, we.updated_at
        "#,
    )
    .bind(we_id)
    .bind(workout_id)
    .bind(user_id)
    .bind(&input.sets)
    .bind(&input.reps)
    .bind(&input.weight)
    .fetch_optional(pool)
    .await?;

    Ok(we)
}

pub async fn move_exercise(
    pool: &PgPool,
    we_id: WorkoutExerciseId,
    workout_id: WorkoutId,
    user_id: UserId,
    input: &MoveWorkoutExercise,
) -> Result<Option<WorkoutExerciseWithName>> {
    let we = sqlx::query_as::<_, WorkoutExerciseWithName>(
        r#"
        UPDATE workout_exercises we
        SET position = $4,
            updated_at = NOW()
        FROM workouts w, exercises e
        WHERE we.id = $1 AND we.workout_id = $2 AND w.id = we.workout_id
              AND w.user_id = $3 AND e.id = we.exercise_id
        RETURNING we.id, we.workout_id, we.exercise_id, e.name AS exercise_name,
                  we.sets, we.reps, we.weight, we.position, we.created_at, we.updated_at
        "#,
    )
    .bind(we_id)
    .bind(workout_id)
    .bind(user_id)
    .bind(input.position)
    .fetch_optional(pool)
    .await?;

    Ok(we)
}

pub async fn remove_exercise(
    pool: &PgPool,
    we_id: WorkoutExerciseId,
    workout_id: WorkoutId,
    user_id: UserId,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        DELETE FROM workout_exercises we
        USING workouts w
        WHERE we.id = $1 AND we.workout_id = $2
              AND w.id = we.workout_id AND w.user_id = $3
        "#,
    )
    .bind(we_id)
    .bind(workout_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
