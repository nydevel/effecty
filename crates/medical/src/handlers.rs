use std::path::PathBuf;

use axum::extract::{Multipart, Path, Query, State};
use axum::Json;
use effecty_core::types::{AnalysisId, DoctorVisitId, SpecialtyId, UserId};
use serde::Deserialize;
use sqlx::SqlitePool;

use crate::error::MedicalError;
use db::repo::analyses::{self, CreateAnalysis, UpdateAnalysis};
use db::repo::doctor_visits::{self, CreateDoctorVisit, UpdateDoctorVisit};
use db::repo::specialties::{self, CreateSpecialty};

// --- Specialties ---

pub async fn list_specialties(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<specialties::Specialty>>, MedicalError> {
    let list = specialties::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_specialty(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateSpecialty>,
) -> Result<Json<specialties::Specialty>, MedicalError> {
    let specialty = specialties::create(&pool, user_id, &input).await?;
    Ok(Json(specialty))
}

pub async fn delete_specialty(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<SpecialtyId>,
) -> Result<axum::http::StatusCode, MedicalError> {
    let deleted = specialties::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(MedicalError::NotFound)
    }
}

// --- Doctor Visits ---

#[derive(Debug, Deserialize)]
pub struct VisitListQuery {
    pub specialty_id: Option<SpecialtyId>,
}

pub async fn list_visits(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Query(query): Query<VisitListQuery>,
) -> Result<Json<Vec<doctor_visits::DoctorVisitWithSpecialty>>, MedicalError> {
    let list = doctor_visits::list(&pool, user_id, query.specialty_id).await?;
    Ok(Json(list))
}

pub async fn get_visit(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<DoctorVisitId>,
) -> Result<Json<doctor_visits::DoctorVisitWithSpecialty>, MedicalError> {
    let visit = doctor_visits::get(&pool, id, user_id)
        .await?
        .ok_or(MedicalError::NotFound)?;
    Ok(Json(visit))
}

pub async fn create_visit(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateDoctorVisit>,
) -> Result<Json<doctor_visits::DoctorVisit>, MedicalError> {
    let visit = doctor_visits::create(&pool, user_id, &input).await?;
    Ok(Json(visit))
}

pub async fn update_visit(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<DoctorVisitId>,
    Json(input): Json<UpdateDoctorVisit>,
) -> Result<Json<doctor_visits::DoctorVisit>, MedicalError> {
    let visit = doctor_visits::update(&pool, id, user_id, &input)
        .await?
        .ok_or(MedicalError::NotFound)?;
    Ok(Json(visit))
}

pub async fn delete_visit(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<DoctorVisitId>,
) -> Result<axum::http::StatusCode, MedicalError> {
    let deleted = doctor_visits::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(MedicalError::NotFound)
    }
}

pub async fn upload_visit_image(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    axum::Extension(upload_dir): axum::Extension<PathBuf>,
    Path(id): Path<DoctorVisitId>,
    mut multipart: Multipart,
) -> Result<Json<doctor_visits::DoctorVisit>, MedicalError> {
    let field = multipart
        .next_field()
        .await
        .map_err(|e| MedicalError::BadRequest(e.to_string()))?
        .ok_or_else(|| MedicalError::BadRequest("no file provided".into()))?;

    let filename = field.file_name().unwrap_or("image.png").to_string();
    let data = field
        .bytes()
        .await
        .map_err(|e| MedicalError::BadRequest(e.to_string()))?;

    let dir = upload_dir.join(user_id.to_string()).join("medical");
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| MedicalError::Internal(e.into()))?;

    let stored_name = format!("{}_{}", uuid::Uuid::new_v4(), filename);
    let file_path = dir.join(&stored_name);
    tokio::fs::write(&file_path, &data)
        .await
        .map_err(|e| MedicalError::Internal(e.into()))?;

    let relative = format!("{}/medical/{}", user_id, stored_name);

    let visit = doctor_visits::update_image(&pool, id, user_id, &relative)
        .await?
        .ok_or(MedicalError::NotFound)?;

    Ok(Json(visit))
}

pub async fn delete_visit_image(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<DoctorVisitId>,
) -> Result<Json<doctor_visits::DoctorVisit>, MedicalError> {
    let visit = doctor_visits::delete_image(&pool, id, user_id)
        .await?
        .ok_or(MedicalError::NotFound)?;
    Ok(Json(visit))
}

// --- Analyses ---

pub async fn list_analyses(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<analyses::Analysis>>, MedicalError> {
    let list = analyses::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn get_analysis(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<AnalysisId>,
) -> Result<Json<analyses::Analysis>, MedicalError> {
    let analysis = analyses::get(&pool, id, user_id)
        .await?
        .ok_or(MedicalError::NotFound)?;
    Ok(Json(analysis))
}

pub async fn create_analysis(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateAnalysis>,
) -> Result<Json<analyses::Analysis>, MedicalError> {
    let analysis = analyses::create(&pool, user_id, &input).await?;
    Ok(Json(analysis))
}

pub async fn update_analysis(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<AnalysisId>,
    Json(input): Json<UpdateAnalysis>,
) -> Result<Json<analyses::Analysis>, MedicalError> {
    let analysis = analyses::update(&pool, id, user_id, &input)
        .await?
        .ok_or(MedicalError::NotFound)?;
    Ok(Json(analysis))
}

pub async fn delete_analysis(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<AnalysisId>,
) -> Result<axum::http::StatusCode, MedicalError> {
    let deleted = analyses::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(MedicalError::NotFound)
    }
}

pub async fn delete_analysis_image(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<AnalysisId>,
) -> Result<Json<analyses::Analysis>, MedicalError> {
    let analysis = analyses::delete_image(&pool, id, user_id)
        .await?
        .ok_or(MedicalError::NotFound)?;
    Ok(Json(analysis))
}

pub async fn upload_analysis_image(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    axum::Extension(upload_dir): axum::Extension<PathBuf>,
    Path(id): Path<AnalysisId>,
    mut multipart: Multipart,
) -> Result<Json<analyses::Analysis>, MedicalError> {
    let field = multipart
        .next_field()
        .await
        .map_err(|e| MedicalError::BadRequest(e.to_string()))?
        .ok_or_else(|| MedicalError::BadRequest("no file provided".into()))?;

    let filename = field.file_name().unwrap_or("image.png").to_string();
    let data = field
        .bytes()
        .await
        .map_err(|e| MedicalError::BadRequest(e.to_string()))?;

    let dir = upload_dir.join(user_id.to_string()).join("medical");
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| MedicalError::Internal(e.into()))?;

    let stored_name = format!("{}_{}", uuid::Uuid::new_v4(), filename);
    let file_path = dir.join(&stored_name);
    tokio::fs::write(&file_path, &data)
        .await
        .map_err(|e| MedicalError::Internal(e.into()))?;

    let relative = format!("{}/medical/{}", user_id, stored_name);

    let analysis = analyses::update_image(&pool, id, user_id, &relative)
        .await?
        .ok_or(MedicalError::NotFound)?;

    Ok(Json(analysis))
}
