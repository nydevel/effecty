use anyhow::Result;
use effecty_core::types::{UserId, WorkoutsSettings};
use sqlx::SqlitePool;
use uuid::Uuid;

const WORKOUTS_FEATURE: &str = "workouts";

#[derive(Debug, sqlx::FromRow)]
struct WorkoutsSettingsRow {
    settings: sqlx::types::Json<WorkoutsSettings>,
}

pub async fn get_workouts_settings(pool: &SqlitePool, user_id: UserId) -> Result<WorkoutsSettings> {
    let id = Uuid::new_v4();
    let row = sqlx::query_as::<_, WorkoutsSettingsRow>(
        r#"
        INSERT INTO feature_settings (id, user_id, feature, settings)
        VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT (user_id, feature)
        DO UPDATE SET updated_at = feature_settings.updated_at
        RETURNING settings
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(WORKOUTS_FEATURE)
    .bind(sqlx::types::Json(WorkoutsSettings::default()))
    .fetch_one(pool)
    .await?;

    Ok(row.settings.0)
}

pub async fn update_workouts_settings(
    pool: &SqlitePool,
    user_id: UserId,
    settings: &WorkoutsSettings,
) -> Result<WorkoutsSettings> {
    let id = Uuid::new_v4();
    let row = sqlx::query_as::<_, WorkoutsSettingsRow>(
        r#"
        INSERT INTO feature_settings (id, user_id, feature, settings)
        VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT (user_id, feature)
        DO UPDATE SET settings = ?4,
                      updated_at = datetime('now')
        RETURNING settings
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(WORKOUTS_FEATURE)
    .bind(sqlx::types::Json(settings.clone()))
    .fetch_one(pool)
    .await?;

    Ok(row.settings.0)
}
