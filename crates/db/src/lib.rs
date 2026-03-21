#![deny(unsafe_code)]

pub mod password;
pub mod repo;

use anyhow::Result;
use effecty_core::config::DatabaseConfig;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;

pub async fn create_pool(config: &DatabaseConfig) -> Result<SqlitePool> {
    let pool = SqlitePoolOptions::new()
        .max_connections(config.max_connections)
        .connect(&config.url)
        .await?;

    tracing::info!(
        "database pool created (max_connections={})",
        config.max_connections
    );

    Ok(pool)
}

pub async fn run_migrations(db_url: &str) -> Result<()> {
    use migration::{Migrator, MigratorTrait};
    use sea_orm_migration::sea_orm::Database;

    let db = Database::connect(db_url).await?;
    Migrator::up(&db, None).await?;
    db.close().await?;

    tracing::info!("database migrations applied");

    Ok(())
}
