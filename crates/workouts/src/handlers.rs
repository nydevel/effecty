use axum::extract::{Path, State};
use axum::Json;
use effecty_core::types::{ExerciseId, UserId, WorkoutExerciseId, WorkoutId};
use sqlx::SqlitePool;

use crate::error::WorkoutsError;
use db::repo::exercises::{self, CreateExercise, UpdateExercise};
use db::repo::workouts::{
    self, AddExercise, CreateWorkout, DuplicateWorkout, MoveWorkout, MoveWorkoutExercise,
    UpdateWorkout, UpdateWorkoutExercise,
};

// --- Workouts ---

pub async fn list_workouts(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<workouts::Workout>>, WorkoutsError> {
    let list = workouts::list_workouts(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_workout(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateWorkout>,
) -> Result<Json<workouts::Workout>, WorkoutsError> {
    let workout = workouts::create_workout(&pool, user_id, &input).await?;
    Ok(Json(workout))
}

pub async fn move_workout(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<WorkoutId>,
    Json(input): Json<MoveWorkout>,
) -> Result<Json<workouts::Workout>, WorkoutsError> {
    let workout = workouts::move_workout(&pool, id, user_id, &input)
        .await?
        .ok_or(WorkoutsError::NotFound)?;
    Ok(Json(workout))
}

pub async fn duplicate_workout(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<WorkoutId>,
    Json(input): Json<DuplicateWorkout>,
) -> Result<Json<workouts::Workout>, WorkoutsError> {
    let workout = workouts::duplicate_workout(&pool, id, user_id, &input)
        .await?
        .ok_or(WorkoutsError::NotFound)?;
    Ok(Json(workout))
}

pub async fn update_workout(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<WorkoutId>,
    Json(input): Json<UpdateWorkout>,
) -> Result<Json<workouts::Workout>, WorkoutsError> {
    let workout = workouts::update_workout(&pool, id, user_id, &input)
        .await?
        .ok_or(WorkoutsError::NotFound)?;
    Ok(Json(workout))
}

pub async fn delete_workout(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<WorkoutId>,
) -> Result<axum::http::StatusCode, WorkoutsError> {
    let deleted = workouts::delete_workout(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(WorkoutsError::NotFound)
    }
}

// --- Workout Exercises ---

pub async fn list_workout_exercises(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(workout_id): Path<WorkoutId>,
) -> Result<Json<Vec<workouts::WorkoutExerciseWithName>>, WorkoutsError> {
    let list = workouts::list_workout_exercises(&pool, workout_id, user_id).await?;
    Ok(Json(list))
}

pub async fn add_exercise(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(workout_id): Path<WorkoutId>,
    Json(input): Json<AddExercise>,
) -> Result<Json<workouts::WorkoutExerciseWithName>, WorkoutsError> {
    // Verify workout belongs to user
    workouts::get_workout(&pool, workout_id, user_id)
        .await?
        .ok_or(WorkoutsError::NotFound)?;

    // Find or create exercise
    let exercise = exercises::find_or_create_by_name(&pool, user_id, &input.exercise_name).await?;

    let we = workouts::add_exercise(&pool, workout_id, exercise.id).await?;
    Ok(Json(we))
}

pub async fn update_exercise_stats(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((workout_id, we_id)): Path<(WorkoutId, WorkoutExerciseId)>,
    Json(input): Json<UpdateWorkoutExercise>,
) -> Result<Json<workouts::WorkoutExerciseWithName>, WorkoutsError> {
    let we = workouts::update_exercise_stats(&pool, we_id, workout_id, user_id, &input)
        .await?
        .ok_or(WorkoutsError::NotFound)?;
    Ok(Json(we))
}

pub async fn move_exercise(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((workout_id, we_id)): Path<(WorkoutId, WorkoutExerciseId)>,
    Json(input): Json<MoveWorkoutExercise>,
) -> Result<Json<workouts::WorkoutExerciseWithName>, WorkoutsError> {
    let we = workouts::move_exercise(&pool, we_id, workout_id, user_id, &input)
        .await?
        .ok_or(WorkoutsError::NotFound)?;
    Ok(Json(we))
}

pub async fn remove_exercise(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((workout_id, we_id)): Path<(WorkoutId, WorkoutExerciseId)>,
) -> Result<axum::http::StatusCode, WorkoutsError> {
    let deleted = workouts::remove_exercise(&pool, we_id, workout_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(WorkoutsError::NotFound)
    }
}

// --- Exercise Catalog ---

pub async fn list_exercises(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<exercises::Exercise>>, WorkoutsError> {
    let list = exercises::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_exercise(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateExercise>,
) -> Result<Json<exercises::Exercise>, WorkoutsError> {
    let exercise = exercises::create(&pool, user_id, &input).await?;
    Ok(Json(exercise))
}

pub async fn update_exercise(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<ExerciseId>,
    Json(input): Json<UpdateExercise>,
) -> Result<Json<exercises::Exercise>, WorkoutsError> {
    let exercise = exercises::update(&pool, id, user_id, &input)
        .await?
        .ok_or(WorkoutsError::NotFound)?;
    Ok(Json(exercise))
}

pub async fn delete_exercise(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<ExerciseId>,
) -> Result<axum::http::StatusCode, WorkoutsError> {
    let deleted = exercises::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(WorkoutsError::NotFound)
    }
}
