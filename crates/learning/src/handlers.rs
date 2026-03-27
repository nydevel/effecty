use std::path::{Path as StdPath, PathBuf};

use axum::extract::{Multipart, Path, State};
use axum::Json;
use effecty_core::types::{MaterialCommentId, MaterialId, RoadmapNodeId, TagId, TopicId, UserId};
use sqlx::SqlitePool;

use crate::error::LearningError;
use crate::thumbnail;
use db::repo::material_comments;
use db::repo::material_links;
use db::repo::material_topics::{self, LinkTopic};
use db::repo::materials::{self, CreateMaterial, MaterialType, UpdateMaterial};
use db::repo::roadmap_nodes::{self, CreateRoadmapNode, UpdateRoadmapNode};
use db::repo::tags::{self, CreateTag};
use db::repo::topic_tags::{self, LinkTag};
use db::repo::topics::{self, CreateTopic, UpdateTopic};

// --- Topics ---

pub async fn list_topics(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<topics::Topic>>, LearningError> {
    let list = topics::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_topic(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateTopicRequest>,
) -> Result<Json<topics::Topic>, LearningError> {
    if input.tag_ids.is_empty() {
        return Err(LearningError::BadRequest(
            "at least one tag is required".into(),
        ));
    }

    if let Some(parent_id) = input.parent_id {
        let parent = topics::get(&pool, parent_id, user_id).await?;
        if parent.is_none() {
            return Err(LearningError::BadRequest("parent topic not found".into()));
        }
    }

    let topic = topics::create(
        &pool,
        user_id,
        &CreateTopic {
            name: input.name,
            parent_id: input.parent_id,
        },
    )
    .await?;

    #[allow(unused_labels)]
    'link_tags: for tag_id in &input.tag_ids {
        topic_tags::link(&pool, topic.id, *tag_id, user_id).await?;
    }

    Ok(Json(topic))
}

pub async fn update_topic(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<TopicId>,
    Json(input): Json<UpdateTopic>,
) -> Result<Json<topics::Topic>, LearningError> {
    let topic = topics::update(&pool, id, user_id, &input)
        .await?
        .ok_or(LearningError::NotFound)?;
    Ok(Json(topic))
}

pub async fn delete_topic(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<TopicId>,
) -> Result<axum::http::StatusCode, LearningError> {
    let deleted = topics::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(LearningError::NotFound)
    }
}

pub async fn move_topic(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<TopicId>,
    Json(input): Json<MoveTopicRequest>,
) -> Result<Json<topics::Topic>, LearningError> {
    if input.parent_id == Some(id) {
        return Err(LearningError::BadRequest(
            "topic cannot be parent of itself".into(),
        ));
    }

    if let Some(parent_id) = input.parent_id {
        let mut cursor = Some(parent_id);
        while let Some(current_id) = cursor {
            if current_id == id {
                return Err(LearningError::BadRequest(
                    "cannot move topic into its own subtree".into(),
                ));
            }
            cursor = topics::get(&pool, current_id, user_id)
                .await?
                .ok_or_else(|| LearningError::BadRequest("parent topic not found".into()))?
                .parent_id;
        }
    }

    let moved = topics::move_to(&pool, id, user_id, input.parent_id)
        .await?
        .ok_or(LearningError::NotFound)?;
    Ok(Json(moved))
}

// --- Topic Tags ---

pub async fn list_topic_tags(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(topic_id): Path<TopicId>,
) -> Result<Json<Vec<topic_tags::TopicTag>>, LearningError> {
    let list = topic_tags::list(&pool, topic_id, user_id).await?;
    Ok(Json(list))
}

pub async fn link_topic_tag(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(topic_id): Path<TopicId>,
    Json(input): Json<LinkTag>,
) -> Result<Json<topic_tags::TopicTag>, LearningError> {
    let tt = topic_tags::link(&pool, topic_id, input.tag_id, user_id)
        .await?
        .ok_or(LearningError::NotFound)?;
    Ok(Json(tt))
}

pub async fn unlink_topic_tag(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((topic_id, tag_id)): Path<(TopicId, TagId)>,
) -> Result<axum::http::StatusCode, LearningError> {
    let deleted = topic_tags::unlink(&pool, topic_id, tag_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(LearningError::NotFound)
    }
}

// --- Tags (create inline) ---

pub async fn create_tag(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateTag>,
) -> Result<Json<tags::Tag>, LearningError> {
    let tag = tags::create(&pool, user_id, &input).await?;
    Ok(Json(tag))
}

pub async fn list_tags(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<tags::Tag>>, LearningError> {
    let list = tags::list(&pool, user_id).await?;
    Ok(Json(list))
}

// --- Materials ---

pub async fn list_materials(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<materials::Material>>, LearningError> {
    let list = materials::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn list_materials_by_topic(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(topic_id): Path<TopicId>,
) -> Result<Json<Vec<materials::Material>>, LearningError> {
    let list = materials::list_by_topic(&pool, topic_id, user_id).await?;
    Ok(Json(list))
}

pub async fn create_material(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    axum::Extension(upload_dir): axum::Extension<PathBuf>,
    Json(input): Json<CreateMaterial>,
) -> Result<Json<materials::Material>, LearningError> {
    let material = materials::create(&pool, user_id, &input).await?;

    // Link to topic
    material_topics::link(&pool, material.id, input.topic_id, user_id).await?;

    // Generate thumbnail for link-type materials
    let thumb_result = match input.material_type {
        MaterialType::ArticleLink => {
            if let Some(ref url) = input.url {
                generate_link_thumbnail(&pool, material.id, user_id, url, &upload_dir).await
            } else {
                Ok(())
            }
        }
        MaterialType::VideoLink => {
            if let Some(ref url) = input.url {
                generate_video_thumbnail(&pool, material.id, user_id, url, &upload_dir).await
            } else {
                Ok(())
            }
        }
        _ => Ok(()),
    };

    if let Err(err) = thumb_result {
        tracing::warn!("thumbnail generation failed: {err:#}");
    }

    // Reload to include thumbnail_path
    let material = materials::get(&pool, material.id, user_id)
        .await?
        .ok_or(LearningError::NotFound)?;

    Ok(Json(material))
}

pub async fn update_material(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<MaterialId>,
    Json(input): Json<UpdateMaterial>,
) -> Result<Json<materials::Material>, LearningError> {
    let material = materials::update(&pool, id, user_id, &input)
        .await?
        .ok_or(LearningError::NotFound)?;
    Ok(Json(material))
}

pub async fn set_material_status(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<MaterialId>,
    Json(input): Json<SetStatusRequest>,
) -> Result<Json<materials::Material>, LearningError> {
    let valid = ["not_started", "in_progress", "completed"];
    if !valid.contains(&input.status.as_str()) {
        return Err(LearningError::BadRequest(format!(
            "invalid status: {}, expected one of: {}",
            input.status,
            valid.join(", ")
        )));
    }
    let material = materials::set_status(&pool, id, user_id, &input.status)
        .await?
        .ok_or(LearningError::NotFound)?;
    Ok(Json(material))
}

#[derive(Debug, serde::Deserialize)]
pub struct SetStatusRequest {
    pub status: String,
}

pub async fn delete_material(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<MaterialId>,
) -> Result<axum::http::StatusCode, LearningError> {
    let deleted = materials::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(LearningError::NotFound)
    }
}

// --- Material file upload ---

pub async fn upload_material_file(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    axum::Extension(upload_dir): axum::Extension<PathBuf>,
    Path(id): Path<MaterialId>,
    mut multipart: Multipart,
) -> Result<Json<materials::Material>, LearningError> {
    let material = materials::get(&pool, id, user_id)
        .await?
        .ok_or(LearningError::NotFound)?;

    let field = multipart
        .next_field()
        .await
        .map_err(|e| LearningError::BadRequest(format!("multipart error: {e}")))?
        .ok_or_else(|| LearningError::BadRequest("no file provided".into()))?;

    let filename = field.file_name().unwrap_or("upload").to_owned();

    let data = field
        .bytes()
        .await
        .map_err(|e| LearningError::BadRequest(format!("failed to read file: {e}")))?;

    let dir = upload_dir
        .join(user_id.to_string())
        .join(material.id.to_string());
    tokio::fs::create_dir_all(&dir).await?;

    let file_path = dir.join(&filename);
    tokio::fs::write(&file_path, &data).await?;

    let relative_path = format!("{}/{}/{}", user_id, material.id, filename);
    materials::update_file_path(&pool, id, user_id, &relative_path).await?;

    // Generate thumbnail for image uploads
    let mat_type = MaterialType::from_str_val(&material.material_type);
    if mat_type == Some(MaterialType::Image) {
        let thumb_filename = format!("thumb_{filename}");
        let thumb_path = dir.join(&thumb_filename);

        if let Err(err) = thumbnail::generate_image_thumbnail(&file_path, &thumb_path, 300) {
            tracing::warn!("image thumbnail generation failed: {err:#}");
        } else {
            let thumb_relative = format!("{}/{}/{}", user_id, material.id, thumb_filename);
            materials::update_thumbnail(&pool, id, user_id, &thumb_relative).await?;
        }
    }

    let material = materials::get(&pool, id, user_id)
        .await?
        .ok_or(LearningError::NotFound)?;

    Ok(Json(material))
}

// --- Material Topics ---

pub async fn list_material_topics(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(material_id): Path<MaterialId>,
) -> Result<Json<Vec<material_topics::MaterialTopic>>, LearningError> {
    let list = material_topics::list(&pool, material_id, user_id).await?;
    Ok(Json(list))
}

pub async fn link_material_topic(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(material_id): Path<MaterialId>,
    Json(input): Json<LinkTopic>,
) -> Result<Json<material_topics::MaterialTopic>, LearningError> {
    let mt = material_topics::link(&pool, material_id, input.topic_id, user_id)
        .await?
        .ok_or(LearningError::NotFound)?;
    Ok(Json(mt))
}

pub async fn unlink_material_topic(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((material_id, topic_id)): Path<(MaterialId, TopicId)>,
) -> Result<axum::http::StatusCode, LearningError> {
    let deleted = material_topics::unlink(&pool, material_id, topic_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(LearningError::NotFound)
    }
}

// --- Material search ---

pub async fn search_materials(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    axum::extract::Query(params): axum::extract::Query<SearchQuery>,
) -> Result<Json<Vec<materials::Material>>, LearningError> {
    let list = materials::search(&pool, user_id, &params.q).await?;
    Ok(Json(list))
}

#[derive(Debug, serde::Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

// --- Material comments ---

pub async fn list_material_comments(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(material_id): Path<MaterialId>,
) -> Result<Json<Vec<material_comments::MaterialComment>>, LearningError> {
    let list = material_comments::list(&pool, material_id, user_id).await?;
    Ok(Json(list))
}

pub async fn create_material_comment(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(material_id): Path<MaterialId>,
    Json(input): Json<CreateCommentRequest>,
) -> Result<Json<material_comments::MaterialComment>, LearningError> {
    if input.content.trim().is_empty() {
        return Err(LearningError::BadRequest("content cannot be empty".into()));
    }
    let comment_type = input.comment_type.as_deref().unwrap_or("text");
    let comment =
        material_comments::create(&pool, material_id, user_id, comment_type, &input.content)
            .await?;
    Ok(Json(comment))
}

pub async fn delete_material_comment(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((_material_id, comment_id)): Path<(MaterialId, MaterialCommentId)>,
) -> Result<axum::http::StatusCode, LearningError> {
    let deleted = material_comments::delete(&pool, comment_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(LearningError::NotFound)
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct CreateCommentRequest {
    pub content: String,
    pub comment_type: Option<String>,
}

// --- Material links ---

pub async fn list_material_links(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(material_id): Path<MaterialId>,
) -> Result<Json<Vec<material_links::MaterialLink>>, LearningError> {
    let list = material_links::list(&pool, material_id, user_id).await?;
    Ok(Json(list))
}

pub async fn link_material(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(material_id): Path<MaterialId>,
    Json(input): Json<LinkMaterialRequest>,
) -> Result<Json<material_links::MaterialLink>, LearningError> {
    let link = material_links::link(&pool, material_id, input.target_material_id, user_id)
        .await?
        .ok_or(LearningError::BadRequest(
            "cannot link material to itself".into(),
        ))?;
    Ok(Json(link))
}

pub async fn unlink_material(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path((material_id, target_id)): Path<(MaterialId, MaterialId)>,
) -> Result<axum::http::StatusCode, LearningError> {
    let deleted = material_links::unlink(&pool, material_id, target_id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(LearningError::NotFound)
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct LinkMaterialRequest {
    pub target_material_id: MaterialId,
}

// --- URL metadata ---

#[derive(Debug, serde::Deserialize)]
pub struct FetchTitleRequest {
    pub url: String,
}

#[derive(Debug, serde::Serialize)]
pub struct FetchTitleResponse {
    pub title: Option<String>,
}

pub async fn fetch_url_title(
    Json(input): Json<FetchTitleRequest>,
) -> Result<Json<FetchTitleResponse>, LearningError> {
    let title = thumbnail::fetch_page_title(&input.url)
        .await
        .unwrap_or_else(|err| {
            tracing::warn!("failed to fetch page title: {err:#}");
            None
        });

    Ok(Json(FetchTitleResponse { title }))
}

// --- Private helpers ---

#[derive(Debug, serde::Deserialize)]
pub struct CreateTopicRequest {
    pub name: String,
    pub parent_id: Option<TopicId>,
    pub tag_ids: Vec<TagId>,
}

#[derive(Debug, serde::Deserialize)]
pub struct MoveTopicRequest {
    pub parent_id: Option<TopicId>,
}

async fn generate_link_thumbnail(
    pool: &SqlitePool,
    material_id: MaterialId,
    user_id: UserId,
    url: &str,
    upload_dir: &StdPath,
) -> anyhow::Result<()> {
    let image_url = match thumbnail::fetch_og_image(url).await? {
        Some(u) => u,
        None => return Ok(()),
    };

    let dir = upload_dir
        .join(user_id.to_string())
        .join(material_id.to_string());
    let dest = dir.join("og_thumbnail.jpg");

    thumbnail::download_image(&image_url, &dest).await?;

    let relative = format!("{}/{}/og_thumbnail.jpg", user_id, material_id);
    materials::update_thumbnail(pool, material_id, user_id, &relative).await?;

    Ok(())
}

async fn generate_video_thumbnail(
    pool: &SqlitePool,
    material_id: MaterialId,
    user_id: UserId,
    url: &str,
    upload_dir: &StdPath,
) -> anyhow::Result<()> {
    let thumb_url = match thumbnail::extract_youtube_thumbnail(url) {
        Some(u) => u,
        None => return Ok(()),
    };

    let dir = upload_dir
        .join(user_id.to_string())
        .join(material_id.to_string());
    let dest = dir.join("yt_thumbnail.jpg");

    thumbnail::download_image(&thumb_url, &dest).await?;

    let relative = format!("{}/{}/yt_thumbnail.jpg", user_id, material_id);
    materials::update_thumbnail(pool, material_id, user_id, &relative).await?;

    Ok(())
}

// --- Roadmap Nodes ---

pub async fn list_roadmap_nodes(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<Json<Vec<roadmap_nodes::RoadmapNode>>, LearningError> {
    let list = roadmap_nodes::list(&pool, user_id).await?;
    Ok(Json(list))
}

pub async fn create_roadmap_node(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(input): Json<CreateRoadmapNode>,
) -> Result<Json<roadmap_nodes::RoadmapNode>, LearningError> {
    let node = roadmap_nodes::create(&pool, user_id, &input).await?;
    Ok(Json(node))
}

pub async fn update_roadmap_node(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<RoadmapNodeId>,
    Json(input): Json<UpdateRoadmapNode>,
) -> Result<Json<roadmap_nodes::RoadmapNode>, LearningError> {
    let node = roadmap_nodes::update(&pool, id, user_id, &input)
        .await?
        .ok_or(LearningError::NotFound)?;
    Ok(Json(node))
}

pub async fn delete_roadmap_node(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Path(id): Path<RoadmapNodeId>,
) -> Result<axum::http::StatusCode, LearningError> {
    let deleted = roadmap_nodes::delete(&pool, id, user_id).await?;
    if deleted {
        Ok(axum::http::StatusCode::NO_CONTENT)
    } else {
        Err(LearningError::NotFound)
    }
}
