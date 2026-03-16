use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{MaterialId, TopicId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MaterialType {
    ArticleLink,
    VideoLink,
    Text,
    Image,
    Document,
}

impl MaterialType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::ArticleLink => "article_link",
            Self::VideoLink => "video_link",
            Self::Text => "text",
            Self::Image => "image",
            Self::Document => "document",
        }
    }

    pub fn from_str_val(s: &str) -> Option<Self> {
        match s {
            "article_link" => Some(Self::ArticleLink),
            "video_link" => Some(Self::VideoLink),
            "text" => Some(Self::Text),
            "image" => Some(Self::Image),
            "document" => Some(Self::Document),
            _ => None,
        }
    }
}

#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Material {
    pub id: MaterialId,
    pub user_id: UserId,
    pub material_type: String,
    pub title: String,
    pub url: Option<String>,
    pub content: Option<String>,
    pub file_path: Option<String>,
    pub thumbnail_path: Option<String>,
    pub is_done: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMaterial {
    pub material_type: MaterialType,
    pub title: String,
    pub url: Option<String>,
    pub content: Option<String>,
    pub topic_id: TopicId,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMaterial {
    pub title: Option<String>,
    pub url: Option<String>,
    pub content: Option<String>,
}

pub async fn list(pool: &PgPool, user_id: UserId) -> Result<Vec<Material>> {
    let materials = sqlx::query_as::<_, Material>(
        "SELECT * FROM materials WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(materials)
}

pub async fn list_by_topic(
    pool: &PgPool,
    topic_id: TopicId,
    user_id: UserId,
) -> Result<Vec<Material>> {
    let materials = sqlx::query_as::<_, Material>(
        r#"
        SELECT m.*
        FROM materials m
        JOIN material_topics mt ON mt.material_id = m.id
        WHERE mt.topic_id = $1 AND m.user_id = $2
        ORDER BY m.created_at DESC
        "#,
    )
    .bind(topic_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(materials)
}

pub async fn get(pool: &PgPool, id: MaterialId, user_id: UserId) -> Result<Option<Material>> {
    let material =
        sqlx::query_as::<_, Material>("SELECT * FROM materials WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .fetch_optional(pool)
            .await?;

    Ok(material)
}

pub async fn create(pool: &PgPool, user_id: UserId, input: &CreateMaterial) -> Result<Material> {
    let title = input.title.split_whitespace().collect::<Vec<_>>().join(" ");

    let material = sqlx::query_as::<_, Material>(
        r#"
        INSERT INTO materials (user_id, material_type, title, url, content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(input.material_type.as_str())
    .bind(&title)
    .bind(&input.url)
    .bind(&input.content)
    .fetch_one(pool)
    .await?;

    Ok(material)
}

pub async fn update(
    pool: &PgPool,
    id: MaterialId,
    user_id: UserId,
    input: &UpdateMaterial,
) -> Result<Option<Material>> {
    let material = sqlx::query_as::<_, Material>(
        r#"
        UPDATE materials
        SET title = COALESCE($3, title),
            url = COALESCE($4, url),
            content = COALESCE($5, content),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.title)
    .bind(&input.url)
    .bind(&input.content)
    .fetch_optional(pool)
    .await?;

    Ok(material)
}

pub async fn update_file_path(
    pool: &PgPool,
    id: MaterialId,
    user_id: UserId,
    file_path: &str,
) -> Result<Option<Material>> {
    let material = sqlx::query_as::<_, Material>(
        r#"
        UPDATE materials
        SET file_path = $3, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(file_path)
    .fetch_optional(pool)
    .await?;

    Ok(material)
}

pub async fn update_thumbnail(
    pool: &PgPool,
    id: MaterialId,
    user_id: UserId,
    thumbnail_path: &str,
) -> Result<Option<Material>> {
    let material = sqlx::query_as::<_, Material>(
        r#"
        UPDATE materials
        SET thumbnail_path = $3, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(thumbnail_path)
    .fetch_optional(pool)
    .await?;

    Ok(material)
}

pub async fn toggle_done(
    pool: &PgPool,
    id: MaterialId,
    user_id: UserId,
) -> Result<Option<Material>> {
    let material = sqlx::query_as::<_, Material>(
        r#"
        UPDATE materials
        SET is_done = NOT is_done, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(material)
}

pub async fn delete(pool: &PgPool, id: MaterialId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM materials WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
