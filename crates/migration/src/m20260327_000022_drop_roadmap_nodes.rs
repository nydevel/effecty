use sea_orm_migration::prelude::*;

use crate::m20260311_000001_create_users::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table(RoadmapNodes::Table)
                    .if_exists()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(RoadmapNodes::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(RoadmapNodes::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(RoadmapNodes::UserId).uuid().not_null())
                    .col(ColumnDef::new(RoadmapNodes::ParentId).uuid().null())
                    .col(
                        ColumnDef::new(RoadmapNodes::Label)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(RoadmapNodes::PositionX)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(RoadmapNodes::PositionY)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(RoadmapNodes::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .col(
                        ColumnDef::new(RoadmapNodes::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(RoadmapNodes::Table, RoadmapNodes::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(RoadmapNodes::Table, RoadmapNodes::ParentId)
                            .to(RoadmapNodes::Table, RoadmapNodes::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_roadmap_nodes_user")
                    .table(RoadmapNodes::Table)
                    .col(RoadmapNodes::UserId)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum RoadmapNodes {
    Table,
    Id,
    UserId,
    ParentId,
    Label,
    PositionX,
    PositionY,
    CreatedAt,
    UpdatedAt,
}
