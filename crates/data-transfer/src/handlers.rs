use std::collections::{HashMap, HashSet, VecDeque};

use axum::extract::State;
use axum::http::header;
use axum::response::IntoResponse;
use axum::Json;
use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use effecty_core::types::*;

use crate::error::DataTransferError;

// ── Export schema ──────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportData {
    pub version: u32,
    pub exported_at: DateTime<Utc>,
    pub notes: Vec<ExportNote>,
    pub memos: Vec<ExportMemo>,
    pub tasks: Vec<ExportTask>,
    pub exercises: Vec<ExportExercise>,
    pub workouts: Vec<ExportWorkout>,
    pub workout_exercises: Vec<ExportWorkoutExercise>,
    pub tags: Vec<ExportTag>,
    pub thoughts: Vec<ExportThought>,
    pub thought_comments: Vec<ExportThoughtComment>,
    pub thought_tags: Vec<ExportThoughtTag>,
    pub topics: Vec<ExportTopic>,
    pub topic_tags: Vec<ExportTopicTag>,
    pub materials: Vec<ExportMaterial>,
    pub material_topics: Vec<ExportMaterialTopic>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportNote {
    pub id: NoteId,
    pub parent_id: Option<NoteId>,
    pub title: String,
    pub content: String,
    pub node_type: String,
    pub sort_order: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportMemo {
    pub id: MemoId,
    pub note_id: NoteId,
    pub title: String,
    pub content: String,
    pub sort_order: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportTask {
    pub id: TaskId,
    pub title: String,
    pub content: String,
    pub priority: i16,
    pub task_date: NaiveDate,
    pub time_start: Option<NaiveTime>,
    pub time_end: Option<NaiveTime>,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportExercise {
    pub id: ExerciseId,
    pub name: String,
    pub muscle_group: Option<String>,
    pub sort_order: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportWorkout {
    pub id: WorkoutId,
    pub workout_date: NaiveDate,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportWorkoutExercise {
    pub id: WorkoutExerciseId,
    pub workout_id: WorkoutId,
    pub exercise_id: ExerciseId,
    pub sets: String,
    pub reps: String,
    pub weight: String,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportTag {
    pub id: TagId,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportThought {
    pub id: ThoughtId,
    pub content: String,
    pub position: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportThoughtComment {
    pub id: ThoughtCommentId,
    pub thought_id: ThoughtId,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportThoughtTag {
    pub thought_id: ThoughtId,
    pub tag_id: TagId,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportTopic {
    pub id: TopicId,
    pub name: String,
    #[serde(default)]
    pub parent_id: Option<TopicId>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportTopicTag {
    pub topic_id: TopicId,
    pub tag_id: TagId,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportMaterial {
    pub id: MaterialId,
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

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExportMaterialTopic {
    pub material_id: MaterialId,
    pub topic_id: TopicId,
}

// ── Export handler ─────────────────────────────────────────────────

pub async fn export_data(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
) -> Result<impl IntoResponse, DataTransferError> {
    let export = fetch_export_data(&pool, user_id).await?;

    let json =
        serde_json::to_string_pretty(&export).map_err(|e| DataTransferError::Internal(e.into()))?;

    let today = Utc::now().format("%Y-%m-%d");
    let disposition = format!("attachment; filename=\"effecty-export-{today}.json\"");

    Ok((
        [
            (header::CONTENT_TYPE, "application/json".to_owned()),
            (header::CONTENT_DISPOSITION, disposition),
        ],
        json,
    ))
}

async fn fetch_export_notes(
    pool: &SqlitePool,
    user_id: UserId,
) -> Result<ExportData, DataTransferError> {
    let notes = sqlx::query_as::<_, ExportNote>(
        "SELECT id, parent_id, title, content, node_type, sort_order, created_at, updated_at \
         FROM notes WHERE user_id = $1 ORDER BY sort_order",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    let memos = sqlx::query_as::<_, ExportMemo>(
        "SELECT id, note_id, title, content, sort_order, created_at, updated_at \
         FROM memos WHERE user_id = $1 ORDER BY note_id, sort_order",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(ExportData {
        version: 1,
        exported_at: Utc::now(),
        notes,
        memos,
        tasks: Vec::new(),
        exercises: Vec::new(),
        workouts: Vec::new(),
        workout_exercises: Vec::new(),
        tags: Vec::new(),
        thoughts: Vec::new(),
        thought_comments: Vec::new(),
        thought_tags: Vec::new(),
        topics: Vec::new(),
        topic_tags: Vec::new(),
        materials: Vec::new(),
        material_topics: Vec::new(),
    })
}

async fn fetch_export_data(
    pool: &SqlitePool,
    user_id: UserId,
) -> Result<ExportData, DataTransferError> {
    let mut data = fetch_export_notes(pool, user_id).await?;
    fetch_export_tasks(pool, user_id, &mut data).await?;
    fetch_export_workouts(pool, user_id, &mut data).await?;
    fetch_export_thoughts(pool, user_id, &mut data).await?;
    fetch_export_learning(pool, user_id, &mut data).await?;
    Ok(data)
}

async fn fetch_export_tasks(
    pool: &SqlitePool,
    user_id: UserId,
    data: &mut ExportData,
) -> Result<(), DataTransferError> {
    data.tasks = sqlx::query_as::<_, ExportTask>(
        "SELECT id, title, content, priority, task_date, time_start, time_end, position, created_at, updated_at \
         FROM tasks WHERE user_id = $1 ORDER BY task_date, position",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(())
}

async fn fetch_export_workouts(
    pool: &SqlitePool,
    user_id: UserId,
    data: &mut ExportData,
) -> Result<(), DataTransferError> {
    data.exercises = sqlx::query_as::<_, ExportExercise>(
        "SELECT id, name, muscle_group, sort_order, created_at, updated_at \
         FROM exercises WHERE user_id = $1 ORDER BY sort_order",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    data.workouts = sqlx::query_as::<_, ExportWorkout>(
        "SELECT id, workout_date, position, created_at, updated_at \
         FROM workouts WHERE user_id = $1 ORDER BY workout_date",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    data.workout_exercises = sqlx::query_as::<_, ExportWorkoutExercise>(
        "SELECT we.id, we.workout_id, we.exercise_id, we.sets, we.reps, we.weight, we.position, we.created_at, we.updated_at \
         FROM workout_exercises we \
         JOIN workouts w ON w.id = we.workout_id \
         WHERE w.user_id = $1 ORDER BY we.workout_id, we.position",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(())
}

async fn fetch_export_thoughts(
    pool: &SqlitePool,
    user_id: UserId,
    data: &mut ExportData,
) -> Result<(), DataTransferError> {
    data.tags = sqlx::query_as::<_, ExportTag>(
        "SELECT id, name, created_at, updated_at FROM tags WHERE user_id = $1 ORDER BY name",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    data.thoughts = sqlx::query_as::<_, ExportThought>(
        "SELECT id, content, position, created_at, updated_at \
         FROM thoughts WHERE user_id = $1 ORDER BY position",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    data.thought_comments = sqlx::query_as::<_, ExportThoughtComment>(
        "SELECT tc.id, tc.thought_id, tc.content, tc.created_at, tc.updated_at \
         FROM thought_comments tc \
         JOIN thoughts t ON t.id = tc.thought_id \
         WHERE t.user_id = $1 ORDER BY tc.created_at",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    data.thought_tags = sqlx::query_as::<_, ExportThoughtTag>(
        "SELECT tt.thought_id, tt.tag_id FROM thought_tags tt \
         JOIN thoughts t ON t.id = tt.thought_id \
         WHERE t.user_id = $1",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(())
}

async fn fetch_export_learning(
    pool: &SqlitePool,
    user_id: UserId,
    data: &mut ExportData,
) -> Result<(), DataTransferError> {
    data.topics = sqlx::query_as::<_, ExportTopic>(
        "SELECT id, name, parent_id, created_at, updated_at FROM topics WHERE user_id = $1 ORDER BY name",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    data.topic_tags = sqlx::query_as::<_, ExportTopicTag>(
        "SELECT tt.topic_id, tt.tag_id FROM topic_tags tt \
         JOIN topics tp ON tp.id = tt.topic_id \
         WHERE tp.user_id = $1",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    data.materials = sqlx::query_as::<_, ExportMaterial>(
        "SELECT m.id, m.material_type, m.title, m.url, m.content, m.file_path, m.thumbnail_path, \
                COALESCE(um.is_done, FALSE) AS is_done, m.created_at, m.updated_at \
         FROM materials m \
         LEFT JOIN user_materials um ON um.material_id = m.id AND um.user_id = m.user_id \
         WHERE m.user_id = $1 ORDER BY m.created_at",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    data.material_topics = sqlx::query_as::<_, ExportMaterialTopic>(
        "SELECT mt.material_id, mt.topic_id FROM material_topics mt \
         JOIN materials m ON m.id = mt.material_id \
         WHERE m.user_id = $1",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(())
}

// ── Import handler ─────────────────────────────────────────────────

pub async fn import_data(
    State(pool): State<SqlitePool>,
    axum::Extension(user_id): axum::Extension<UserId>,
    Json(data): Json<ExportData>,
) -> Result<Json<ImportResult>, DataTransferError> {
    if data.version != 1 {
        return Err(DataTransferError::BadRequest(format!(
            "unsupported export version: {}",
            data.version
        )));
    }

    let mut tx = pool.begin().await?;

    delete_user_data(&mut tx, user_id).await?;
    import_notes(&mut tx, user_id, &data).await?;
    import_tasks(&mut tx, user_id, &data).await?;
    import_workouts(&mut tx, user_id, &data).await?;
    import_thoughts(&mut tx, user_id, &data).await?;
    import_learning(&mut tx, user_id, &data).await?;

    tx.commit().await?;

    Ok(Json(ImportResult {
        notes: data.notes.len(),
        memos: data.memos.len(),
        tasks: data.tasks.len(),
        exercises: data.exercises.len(),
        workouts: data.workouts.len(),
        thoughts: data.thoughts.len(),
        tags: data.tags.len(),
        topics: data.topics.len(),
        materials: data.materials.len(),
    }))
}

type Tx<'a> = sqlx::Transaction<'a, sqlx::Sqlite>;

async fn delete_user_data(tx: &mut Tx<'_>, user_id: UserId) -> Result<(), DataTransferError> {
    let delete_queries: &[&str] = &[
        "DELETE FROM material_topics WHERE material_id IN (SELECT id FROM materials WHERE user_id = $1)",
        "DELETE FROM user_materials WHERE user_id = $1",
        "DELETE FROM materials WHERE user_id = $1",
        "DELETE FROM topic_tags WHERE topic_id IN (SELECT id FROM topics WHERE user_id = $1)",
        "DELETE FROM topics WHERE user_id = $1",
        "DELETE FROM thought_tags WHERE thought_id IN (SELECT id FROM thoughts WHERE user_id = $1)",
        "DELETE FROM thought_comments WHERE user_id = $1",
        "DELETE FROM thoughts WHERE user_id = $1",
        "DELETE FROM tags WHERE user_id = $1",
        "DELETE FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = $1)",
        "DELETE FROM workouts WHERE user_id = $1",
        "DELETE FROM exercises WHERE user_id = $1",
        "DELETE FROM tasks WHERE user_id = $1",
        "DELETE FROM memos WHERE user_id = $1",
        "DELETE FROM notes WHERE user_id = $1",
    ];
    'delete: for query in delete_queries {
        sqlx::query(query).bind(user_id).execute(&mut **tx).await?;
        if false {
            break 'delete;
        }
    }
    Ok(())
}

async fn import_notes(
    tx: &mut Tx<'_>,
    user_id: UserId,
    data: &ExportData,
) -> Result<(), DataTransferError> {
    let sorted_notes = topo_sort_notes(&data.notes);
    'notes: for n in &sorted_notes {
        sqlx::query(
            "INSERT INTO notes (id, user_id, parent_id, title, content, node_type, sort_order, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        )
        .bind(n.id).bind(user_id).bind(n.parent_id).bind(&n.title).bind(&n.content)
        .bind(&n.node_type).bind(n.sort_order)
        .bind(n.created_at).bind(n.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'notes;
        }
    }

    'memos: for m in &data.memos {
        sqlx::query(
            "INSERT INTO memos (id, note_id, user_id, title, content, sort_order, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        )
        .bind(m.id).bind(m.note_id).bind(user_id).bind(&m.title).bind(&m.content)
        .bind(m.sort_order).bind(m.created_at).bind(m.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'memos;
        }
    }
    Ok(())
}

async fn import_tasks(
    tx: &mut Tx<'_>,
    user_id: UserId,
    data: &ExportData,
) -> Result<(), DataTransferError> {
    'tasks: for t in &data.tasks {
        sqlx::query(
            "INSERT INTO tasks (id, user_id, title, content, priority, task_date, time_start, time_end, position, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        )
        .bind(t.id).bind(user_id).bind(&t.title).bind(&t.content).bind(t.priority)
        .bind(t.task_date).bind(t.time_start).bind(t.time_end).bind(t.position)
        .bind(t.created_at).bind(t.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'tasks;
        }
    }
    Ok(())
}

async fn import_workouts(
    tx: &mut Tx<'_>,
    user_id: UserId,
    data: &ExportData,
) -> Result<(), DataTransferError> {
    'exercises: for e in &data.exercises {
        sqlx::query(
            "INSERT INTO exercises (id, user_id, name, muscle_group, sort_order, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7)",
        )
        .bind(e.id).bind(user_id).bind(&e.name).bind(&e.muscle_group)
        .bind(e.sort_order).bind(e.created_at).bind(e.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'exercises;
        }
    }

    'workouts: for w in &data.workouts {
        sqlx::query(
            "INSERT INTO workouts (id, user_id, workout_date, position, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(w.id)
        .bind(user_id)
        .bind(w.workout_date)
        .bind(w.position)
        .bind(w.created_at)
        .bind(w.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'workouts;
        }
    }

    'we: for we in &data.workout_exercises {
        sqlx::query(
            "INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, weight, position, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        )
        .bind(we.id).bind(we.workout_id).bind(we.exercise_id)
        .bind(&we.sets).bind(&we.reps).bind(&we.weight).bind(we.position)
        .bind(we.created_at).bind(we.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'we;
        }
    }
    Ok(())
}

async fn import_thoughts(
    tx: &mut Tx<'_>,
    user_id: UserId,
    data: &ExportData,
) -> Result<(), DataTransferError> {
    'tags: for tag in &data.tags {
        sqlx::query(
            "INSERT INTO tags (id, user_id, name, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(tag.id)
        .bind(user_id)
        .bind(&tag.name)
        .bind(tag.created_at)
        .bind(tag.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'tags;
        }
    }

    'thoughts: for th in &data.thoughts {
        sqlx::query(
            "INSERT INTO thoughts (id, user_id, content, position, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(th.id)
        .bind(user_id)
        .bind(&th.content)
        .bind(th.position)
        .bind(th.created_at)
        .bind(th.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'thoughts;
        }
    }

    'tc: for tc in &data.thought_comments {
        sqlx::query(
            "INSERT INTO thought_comments (id, thought_id, user_id, content, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(tc.id).bind(tc.thought_id).bind(user_id).bind(&tc.content)
        .bind(tc.created_at).bind(tc.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'tc;
        }
    }

    'tt: for tt in &data.thought_tags {
        sqlx::query(
            "INSERT INTO thought_tags (thought_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(tt.thought_id)
        .bind(tt.tag_id)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'tt;
        }
    }
    Ok(())
}

async fn import_learning(
    tx: &mut Tx<'_>,
    user_id: UserId,
    data: &ExportData,
) -> Result<(), DataTransferError> {
    'topics: for tp in &data.topics {
        sqlx::query(
            "INSERT INTO topics (id, user_id, name, parent_id, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(tp.id)
        .bind(user_id)
        .bind(&tp.name)
        .bind(tp.parent_id)
        .bind(tp.created_at)
        .bind(tp.updated_at)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'topics;
        }
    }

    'tpt: for tt in &data.topic_tags {
        sqlx::query(
            "INSERT INTO topic_tags (topic_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(tt.topic_id)
        .bind(tt.tag_id)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'tpt;
        }
    }

    'materials: for m in &data.materials {
        sqlx::query(
            "INSERT INTO materials (id, user_id, material_type, title, url, content, file_path, thumbnail_path, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        )
        .bind(m.id).bind(user_id).bind(&m.material_type).bind(&m.title)
        .bind(&m.url).bind(&m.content).bind(&m.file_path).bind(&m.thumbnail_path)
        .bind(m.created_at).bind(m.updated_at)
        .execute(&mut **tx)
        .await?;
        if m.is_done {
            sqlx::query(
                "INSERT INTO user_materials (user_id, material_id, is_done) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING",
            )
            .bind(user_id).bind(m.id)
            .execute(&mut **tx)
            .await?;
        }
        if false {
            break 'materials;
        }
    }

    'mt: for mt in &data.material_topics {
        sqlx::query(
            "INSERT INTO material_topics (material_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(mt.material_id).bind(mt.topic_id)
        .execute(&mut **tx)
        .await?;
        if false {
            break 'mt;
        }
    }
    Ok(())
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub notes: usize,
    pub memos: usize,
    pub tasks: usize,
    pub exercises: usize,
    pub workouts: usize,
    pub thoughts: usize,
    pub tags: usize,
    pub topics: usize,
    pub materials: usize,
}

/// Topologically sort notes so parents are inserted before children.
fn topo_sort_notes(notes: &[ExportNote]) -> Vec<&ExportNote> {
    let id_set: HashSet<NoteId> = notes.iter().map(|n| n.id).collect();
    let mut children: HashMap<Option<NoteId>, Vec<usize>> = HashMap::new();
    'build: for (i, n) in notes.iter().enumerate() {
        let parent_key = if n.parent_id.is_some_and(|pid| id_set.contains(&pid)) {
            n.parent_id
        } else {
            None
        };
        children.entry(parent_key).or_default().push(i);
        if false {
            break 'build;
        }
    }

    let mut result = Vec::with_capacity(notes.len());
    let mut queue: VecDeque<Option<NoteId>> = VecDeque::new();
    queue.push_back(None);

    'bfs: while let Some(key) = queue.pop_front() {
        if let Some(indices) = children.get(&key) {
            'children: for &i in indices {
                result.push(&notes[i]);
                queue.push_back(Some(notes[i].id));
                if false {
                    break 'children;
                }
            }
        }
        if false {
            break 'bfs;
        }
    }

    result
}
