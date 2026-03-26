use axum::extract::{Path, Query, State};
use axum::Json;
use effecty_core::types::{ProjectId, ProjectTaskId, UserId};
use sqlx::SqlitePool;

use crate::error::ProjectsError;
use db::repo::project_task_links;
use db::repo::project_tasks::{self, CreateProjectTask, UpdateProjectTask};
use db::repo::projects::{self, CreateProject, UpdateProject};

// --- Projects ---

pub async fn list_projects(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<projects::Project>>, ProjectsError> {
    let list = projects::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_project(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateProject>,
) -> Result<Json<projects::Project>, ProjectsError> {
    if input.name.trim().is_empty() {
        return Err(ProjectsError::BadRequest("name is required".into()));
    }
    let project = projects::create(&pool, user_id, &input).await?;
    Ok(Json(project))
}

pub async fn update_project(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<ProjectId>,
    Json(input): Json<UpdateProject>,
) -> Result<Json<projects::Project>, ProjectsError> {
    let project = projects::update(&pool, id, user_id, &input)
        .await?
        .ok_or(ProjectsError::NotFound)?;
    Ok(Json(project))
}

pub async fn delete_project(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<ProjectId>,
) -> Result<axum::http::StatusCode, ProjectsError> {
    let deleted = projects::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(ProjectsError::NotFound)
    }
}

// --- Project tasks ---

pub async fn list_tasks(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(project_id): Path<ProjectId>,
) -> Result<Json<Vec<project_tasks::ProjectTask>>, ProjectsError> {
    let list = project_tasks::list(&pool, project_id, user_id).await?;
    Ok(Json(list))
}

pub async fn create_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(project_id): Path<ProjectId>,
    Json(input): Json<CreateProjectTask>,
) -> Result<Json<project_tasks::ProjectTask>, ProjectsError> {
    if input.title.trim().is_empty() {
        return Err(ProjectsError::BadRequest("title is required".into()));
    }
    let task = project_tasks::create(&pool, project_id, user_id, &input).await?;
    Ok(Json(task))
}

pub async fn update_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_project_id, task_id)): Path<(ProjectId, ProjectTaskId)>,
    Json(input): Json<UpdateProjectTask>,
) -> Result<Json<project_tasks::ProjectTask>, ProjectsError> {
    if let Some(ref status) = input.status {
        let valid = ["todo", "in_progress", "done"];
        if !valid.contains(&status.as_str()) {
            return Err(ProjectsError::BadRequest(format!(
                "invalid status: {status}"
            )));
        }
    }
    let task = project_tasks::update(&pool, task_id, user_id, &input)
        .await?
        .ok_or(ProjectsError::NotFound)?;
    Ok(Json(task))
}

pub async fn delete_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_project_id, task_id)): Path<(ProjectId, ProjectTaskId)>,
) -> Result<axum::http::StatusCode, ProjectsError> {
    let deleted = project_tasks::delete(&pool, task_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(ProjectsError::NotFound)
    }
}

pub async fn search_tasks(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(project_id): Path<ProjectId>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<Vec<project_tasks::ProjectTask>>, ProjectsError> {
    let list = project_tasks::search(&pool, project_id, user_id, &params.q).await?;
    Ok(Json(list))
}

#[derive(Debug, serde::Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

// --- Task links ---

pub async fn list_task_links(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_project_id, task_id)): Path<(ProjectId, ProjectTaskId)>,
) -> Result<Json<Vec<project_task_links::ProjectTaskLink>>, ProjectsError> {
    let list = project_task_links::list(&pool, task_id, user_id).await?;
    Ok(Json(list))
}

pub async fn link_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_project_id, task_id)): Path<(ProjectId, ProjectTaskId)>,
    Json(input): Json<LinkTaskRequest>,
) -> Result<Json<project_task_links::ProjectTaskLink>, ProjectsError> {
    let valid_types = ["parent", "related", "blocker"];
    if !valid_types.contains(&input.link_type.as_str()) {
        return Err(ProjectsError::BadRequest(format!(
            "invalid link_type: {}, expected: {}",
            input.link_type,
            valid_types.join(", ")
        )));
    }
    let link = project_task_links::link(
        &pool,
        task_id,
        input.target_task_id,
        &input.link_type,
        user_id,
    )
    .await?
    .ok_or(ProjectsError::BadRequest(
        "cannot link task to itself".into(),
    ))?;
    Ok(Json(link))
}

pub async fn unlink_task(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_project_id, task_id, target_id)): Path<(ProjectId, ProjectTaskId, ProjectTaskId)>,
) -> Result<axum::http::StatusCode, ProjectsError> {
    let deleted = project_task_links::unlink(&pool, task_id, target_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(ProjectsError::NotFound)
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct LinkTaskRequest {
    pub target_task_id: ProjectTaskId,
    pub link_type: String,
}
