use sea_orm_migration::prelude::*;

use crate::m20260311_000001_create_users::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Notes::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Notes::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(Notes::UserId).uuid().not_null())
                    .col(ColumnDef::new(Notes::ParentId).uuid())
                    .col(
                        ColumnDef::new(Notes::Title)
                            .text()
                            .not_null()
                            .default("Untitled"),
                    )
                    .col(
                        ColumnDef::new(Notes::Content)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Notes::NodeType)
                            .text()
                            .not_null()
                            .default("file")
                            .check(Expr::col(Notes::NodeType).is_in(["folder", "file"])),
                    )
                    .col(
                        ColumnDef::new(Notes::SortOrder)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(Notes::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .col(
                        ColumnDef::new(Notes::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Notes::Table, Notes::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Notes::Table, Notes::ParentId)
                            .to(Notes::Table, Notes::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_notes_user_parent")
                    .table(Notes::Table)
                    .col(Notes::UserId)
                    .col(Notes::ParentId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_notes_parent_sort")
                    .table(Notes::Table)
                    .col(Notes::ParentId)
                    .col(Notes::SortOrder)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Notes::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Notes {
    Table,
    Id,
    UserId,
    ParentId,
    Title,
    Content,
    NodeType,
    SortOrder,
    CreatedAt,
    UpdatedAt,
}
