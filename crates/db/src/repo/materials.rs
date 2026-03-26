use anyhow::Result;
use chrono::{DateTime, Utc};
use effecty_core::types::{MaterialId, TopicId, UserId};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

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
    pub status: String,
    pub topic_names: String,
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

const SELECT_WITH_STATUS: &str = r#"
    SELECT m.id, m.user_id, m.material_type, m.title, m.url, m.content,
           m.file_path, m.thumbnail_path,
           COALESCE(um.status, 'not_started') AS status,
           COALESCE((SELECT GROUP_CONCAT(t.name, ', ') FROM material_topics mt2 JOIN topics t ON t.id = mt2.topic_id WHERE mt2.material_id = m.id), '') AS topic_names,
           m.created_at, m.updated_at
    FROM materials m
    LEFT JOIN user_materials um ON um.material_id = m.id AND um.user_id = m.user_id
"#;

pub async fn list(pool: &SqlitePool, user_id: UserId) -> Result<Vec<Material>> {
    let query = format!("{SELECT_WITH_STATUS} WHERE m.user_id = ?1 ORDER BY m.created_at DESC");
    let materials = sqlx::query_as::<_, Material>(&query)
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    Ok(materials)
}

pub async fn list_by_topic(
    pool: &SqlitePool,
    topic_id: TopicId,
    user_id: UserId,
) -> Result<Vec<Material>> {
    let query = format!(
        r#"
        {SELECT_WITH_STATUS}
        JOIN material_topics mt ON mt.material_id = m.id
        WHERE mt.topic_id = ?1 AND m.user_id = ?2
        ORDER BY m.created_at DESC
        "#
    );
    let materials = sqlx::query_as::<_, Material>(&query)
        .bind(topic_id)
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    Ok(materials)
}

pub async fn get(pool: &SqlitePool, id: MaterialId, user_id: UserId) -> Result<Option<Material>> {
    let query = format!("{SELECT_WITH_STATUS} WHERE m.id = ?1 AND m.user_id = ?2");
    let material = sqlx::query_as::<_, Material>(&query)
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    Ok(material)
}

pub async fn create(
    pool: &SqlitePool,
    user_id: UserId,
    input: &CreateMaterial,
) -> Result<Material> {
    let title = input.title.split_whitespace().collect::<Vec<_>>().join(" ");

    let id = Uuid::new_v4();
    let mut tx = pool.begin().await?;

    sqlx::query(
        r#"
        INSERT INTO materials (id, user_id, material_type, title, url, content)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.material_type.as_str())
    .bind(&title)
    .bind(&input.url)
    .bind(&input.content)
    .execute(&mut *tx)
    .await?;

    let material = sqlx::query_as::<_, Material>(
        r#"
        SELECT m.id, m.user_id, m.material_type, m.title, m.url, m.content,
               m.file_path, m.thumbnail_path,
               'not_started' AS status,
               '' AS topic_names,
               m.created_at, m.updated_at
        FROM materials m
        WHERE m.id = ?1
        "#,
    )
    .bind(id)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(material)
}

pub async fn update(
    pool: &SqlitePool,
    id: MaterialId,
    user_id: UserId,
    input: &UpdateMaterial,
) -> Result<Option<Material>> {
    let mut tx = pool.begin().await?;

    let result = sqlx::query(
        r#"
        UPDATE materials
        SET title = COALESCE(?3, title),
            url = COALESCE(?4, url),
            content = COALESCE(?5, content),
            updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(&input.title)
    .bind(&input.url)
    .bind(&input.content)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        tx.commit().await?;
        return Ok(None);
    }

    let query = format!("{SELECT_WITH_STATUS} WHERE m.id = ?1 AND m.user_id = ?2");
    let material = sqlx::query_as::<_, Material>(&query)
        .bind(id)
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(material)
}

pub async fn update_file_path(
    pool: &SqlitePool,
    id: MaterialId,
    user_id: UserId,
    file_path: &str,
) -> Result<Option<Material>> {
    let mut tx = pool.begin().await?;

    let result = sqlx::query(
        r#"
        UPDATE materials
        SET file_path = ?3, updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(file_path)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        tx.commit().await?;
        return Ok(None);
    }

    let query = format!("{SELECT_WITH_STATUS} WHERE m.id = ?1 AND m.user_id = ?2");
    let material = sqlx::query_as::<_, Material>(&query)
        .bind(id)
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(material)
}

pub async fn update_thumbnail(
    pool: &SqlitePool,
    id: MaterialId,
    user_id: UserId,
    thumbnail_path: &str,
) -> Result<Option<Material>> {
    let mut tx = pool.begin().await?;

    let result = sqlx::query(
        r#"
        UPDATE materials
        SET thumbnail_path = ?3, updated_at = datetime('now')
        WHERE id = ?1 AND user_id = ?2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(thumbnail_path)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        tx.commit().await?;
        return Ok(None);
    }

    let query = format!("{SELECT_WITH_STATUS} WHERE m.id = ?1 AND m.user_id = ?2");
    let material = sqlx::query_as::<_, Material>(&query)
        .bind(id)
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(material)
}

pub async fn set_status(
    pool: &SqlitePool,
    id: MaterialId,
    user_id: UserId,
    status: &str,
) -> Result<Option<Material>> {
    let um_id = Uuid::new_v4();
    let is_done = status == "completed";
    sqlx::query(
        r#"
        INSERT INTO user_materials (id, user_id, material_id, is_done, status)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT (user_id, material_id)
        DO UPDATE SET status = ?5,
                      is_done = ?4,
                      updated_at = datetime('now')
        "#,
    )
    .bind(um_id)
    .bind(user_id)
    .bind(id)
    .bind(is_done)
    .bind(status)
    .execute(pool)
    .await?;

    get(pool, id, user_id).await
}

pub async fn search(pool: &SqlitePool, user_id: UserId, query: &str) -> Result<Vec<Material>> {
    let pattern = format!("%{query}%");
    let sql = format!(
        "{SELECT_WITH_STATUS} WHERE m.user_id = ?1 AND m.title LIKE ?2 ORDER BY m.created_at DESC LIMIT 20"
    );
    let results = sqlx::query_as::<_, Material>(&sql)
        .bind(user_id)
        .bind(&pattern)
        .fetch_all(pool)
        .await?;

    Ok(results)
}

pub async fn delete(pool: &SqlitePool, id: MaterialId, user_id: UserId) -> Result<bool> {
    let result = sqlx::query("DELETE FROM materials WHERE id = ?1 AND user_id = ?2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}
