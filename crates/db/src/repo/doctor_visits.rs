use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{DoctorVisitId, SpecialtyId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct DoctorVisit {
    pub id: DoctorVisitId,
    pub user_id: UserId,
    pub specialty_id: SpecialtyId,
    pub doctor_name: String,
    pub clinic: String,
    pub visit_date: String,
    pub notes: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct DoctorVisitWithSpecialty {
    pub id: DoctorVisitId,
    pub user_id: UserId,
    pub specialty_id: SpecialtyId,
    pub doctor_name: String,
    pub clinic: String,
    pub visit_date: String,
    pub notes: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub specialty_name: String,
}

const VISIT_COLUMNS: &str =
    "id, user_id, specialty_id, doctor_name, clinic, visit_date, notes, created_at, updated_at";

#[derive(Debug, Deserialize)]
pub struct CreateDoctorVisit {
    pub specialty_id: SpecialtyId,
    pub doctor_name: String,
    pub clinic: String,
    pub visit_date: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDoctorVisit {
    pub specialty_id: Option<SpecialtyId>,
    pub doctor_name: Option<String>,
    pub clinic: Option<String>,
    pub visit_date: Option<String>,
    pub notes: Option<String>,
}

pub async fn list(
    pool: &SqlitePool,
    user_id: UserId,
    specialty_id: Option<SpecialtyId>,
) -> Result<Vec<DoctorVisitWithSpecialty>> {
    let rows = if let Some(sid) = specialty_id {
        sqlx::query_as::<_, DoctorVisitWithSpecialty>(
            r#"
            SELECT dv.id, dv.user_id, dv.specialty_id, dv.doctor_name, dv.clinic,
                   dv.visit_date, dv.notes, dv.created_at, dv.updated_at,
                   ms.name AS specialty_name
            FROM doctor_visits dv
            JOIN medical_specialties ms ON ms.id = dv.specialty_id
            WHERE dv.user_id = ?1 AND dv.specialty_id = ?2
            ORDER BY dv.visit_date DESC
            "#,
        )
        .bind(user_id)
        .bind(sid)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, DoctorVisitWithSpecialty>(
            r#"
            SELECT dv.id, dv.user_id, dv.specialty_id, dv.doctor_name, dv.clinic,
                   dv.visit_date, dv.notes, dv.created_at, dv.updated_at,
                   ms.name AS specialty_name
            FROM doctor_visits dv
            JOIN medical_specialties ms ON ms.id = dv.specialty_id
            WHERE dv.user_id = ?1
            ORDER BY dv.visit_date DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?
    };

    Ok(rows)
}

pub async fn get(
    pool: &SqlitePool,
    id: DoctorVisitId,
    user_id: UserId,
) -> Result<Option<DoctorVisitWithSpecialty>> {
    let row = sqlx::query_as::<_, DoctorVisitWithSpecialty>(
        r#"
        SELECT dv.id, dv.user_id, dv.specialty_id, dv.doctor_name, dv.clinic,
               dv.visit_date, dv.notes, dv.created_at, dv.updated_at,
               ms.name AS specialty_name
        FROM doctor_visits dv
        JOIN medical_specialties ms ON ms.id = dv.specialty_id
        WHERE dv.id = ?1 AND dv.user_id = ?2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(row)
}

pub async fn create(
    pool: &SqlitePool,
    user_id: UserId,
    input: &CreateDoctorVisit,
) -> Result<DoctorVisit> {
    let id = Uuid::new_v4();
    let query = format!(
        r#"
        INSERT INTO doctor_visits (id, user_id, specialty_id, doctor_name, clinic, visit_date)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        RETURNING {VISIT_COLUMNS}
        "#,
    );
    let row = sqlx::query_as::<_, DoctorVisit>(&query)
        .bind(id)
        .bind(user_id)
        .bind(input.specialty_id)
        .bind(&input.doctor_name)
        .bind(&input.clinic)
        .bind(&input.visit_date)
        .fetch_one(pool)
        .await?;

    Ok(row)
}

pub async fn update(
    pool: &SqlitePool,
    id: DoctorVisitId,
    user_id: UserId,
    input: &UpdateDoctorVisit,
) -> Result<Option<DoctorVisit>> {
    let query = format!(
        r#"
        UPDATE doctor_visits
        SET specialty_id = COALESCE(?3, specialty_id),
            doctor_name = COALESCE(?4, doctor_name),
            clinic = COALESCE(?5, clinic),
            visit_date = COALESCE(?6, visit_date),
            notes = COALESCE(?7, notes),
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        RETURNING {VISIT_COLUMNS}
        "#,
    );
    let row = sqlx::query_as::<_, DoctorVisit>(&query)
        .bind(id)
        .bind(user_id)
        .bind(input.specialty_id)
        .bind(&input.doctor_name)
        .bind(&input.clinic)
        .bind(&input.visit_date)
        .bind(&input.notes)
        .fetch_optional(pool)
        .await?;

    Ok(row)
}

pub async fn delete(pool: &SqlitePool, id: DoctorVisitId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM doctor_visits WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
