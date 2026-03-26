use sea_orm_migration::prelude::*;

use crate::m20260311_000001_create_users::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create medical_images table
        manager
            .create_table(
                Table::create()
                    .table(MedicalImages::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(MedicalImages::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(MedicalImages::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(MedicalImages::OwnerType)
                            .text()
                            .not_null(),
                    )
                    .col(ColumnDef::new(MedicalImages::OwnerId).uuid().not_null())
                    .col(
                        ColumnDef::new(MedicalImages::FilePath)
                            .text()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(MedicalImages::Position)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(MedicalImages::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(MedicalImages::Table, MedicalImages::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_medical_images_owner")
                    .table(MedicalImages::Table)
                    .col(MedicalImages::OwnerType)
                    .col(MedicalImages::OwnerId)
                    .to_owned(),
            )
            .await?;

        // Migrate existing image_path data from doctor_visits
        let db = manager.get_connection();
        db.execute_unprepared(
            r#"
            INSERT INTO medical_images (id, user_id, owner_type, owner_id, file_path, position)
            SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
                   user_id, 'visit', id, image_path, 0
            FROM doctor_visits
            WHERE image_path IS NOT NULL
            "#,
        )
        .await?;

        // Migrate existing image_path data from analyses
        db.execute_unprepared(
            r#"
            INSERT INTO medical_images (id, user_id, owner_type, owner_id, file_path, position)
            SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
                   user_id, 'analysis', id, image_path, 0
            FROM analyses
            WHERE image_path IS NOT NULL
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(MedicalImages::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum MedicalImages {
    Table,
    Id,
    UserId,
    OwnerType,
    OwnerId,
    FilePath,
    Position,
    CreatedAt,
}
