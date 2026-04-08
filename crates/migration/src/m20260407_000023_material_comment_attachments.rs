#![deny(unsafe_code)]

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                "ALTER TABLE material_comments ADD COLUMN file_path TEXT NULL",
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "ALTER TABLE material_comments ADD COLUMN file_name TEXT NULL",
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "ALTER TABLE material_comments ADD COLUMN file_mime TEXT NULL",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
