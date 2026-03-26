#![deny(unsafe_code)]

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Add status column to user_materials (replaces boolean is_done)
        manager
            .get_connection()
            .execute_unprepared(
                "ALTER TABLE user_materials ADD COLUMN status TEXT NOT NULL DEFAULT 'not_started'",
            )
            .await?;

        // Migrate existing data
        manager
            .get_connection()
            .execute_unprepared(
                "UPDATE user_materials SET status = CASE WHEN is_done = 1 THEN 'completed' ELSE 'not_started' END",
            )
            .await?;

        // 2. Create material_comments table
        manager
            .create_table(
                Table::create()
                    .table(MaterialComments::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(MaterialComments::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(MaterialComments::MaterialId)
                            .uuid()
                            .not_null(),
                    )
                    .col(ColumnDef::new(MaterialComments::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(MaterialComments::CommentType)
                            .text()
                            .not_null()
                            .default("text"),
                    )
                    .col(
                        ColumnDef::new(MaterialComments::Content)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(MaterialComments::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(MaterialComments::UpdatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(MaterialComments::Table, MaterialComments::MaterialId)
                            .to(Materials::Table, Materials::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(MaterialComments::Table, MaterialComments::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_material_comments_material")
                    .table(MaterialComments::Table)
                    .col(MaterialComments::MaterialId)
                    .to_owned(),
            )
            .await?;

        // 3. Create material_links table
        manager
            .create_table(
                Table::create()
                    .table(MaterialLinks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(MaterialLinks::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(MaterialLinks::SourceMaterialId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(MaterialLinks::TargetMaterialId)
                            .uuid()
                            .not_null(),
                    )
                    .col(ColumnDef::new(MaterialLinks::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(MaterialLinks::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(MaterialLinks::Table, MaterialLinks::SourceMaterialId)
                            .to(Materials::Table, Materials::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(MaterialLinks::Table, MaterialLinks::TargetMaterialId)
                            .to(Materials::Table, Materials::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(MaterialLinks::Table, MaterialLinks::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_material_links_unique")
                    .table(MaterialLinks::Table)
                    .col(MaterialLinks::SourceMaterialId)
                    .col(MaterialLinks::TargetMaterialId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_material_links_source")
                    .table(MaterialLinks::Table)
                    .col(MaterialLinks::SourceMaterialId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(MaterialLinks::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(MaterialComments::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
enum Materials {
    Table,
    Id,
}

#[derive(Iden)]
enum Users {
    Table,
    Id,
}

#[derive(Iden)]
enum MaterialComments {
    Table,
    Id,
    MaterialId,
    UserId,
    CommentType,
    Content,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum MaterialLinks {
    Table,
    Id,
    SourceMaterialId,
    TargetMaterialId,
    UserId,
    CreatedAt,
}
