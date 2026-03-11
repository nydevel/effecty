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
                    .table(Tasks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Tasks::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(Tasks::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(Tasks::Title)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Tasks::Content)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Tasks::Priority)
                            .small_integer()
                            .not_null()
                            .default(0)
                            .check(
                                Expr::col(Tasks::Priority)
                                    .gte(0)
                                    .and(Expr::col(Tasks::Priority).lte(3)),
                            ),
                    )
                    .col(ColumnDef::new(Tasks::TaskDate).date().not_null())
                    .col(ColumnDef::new(Tasks::TimeStart).time())
                    .col(ColumnDef::new(Tasks::TimeEnd).time())
                    .col(
                        ColumnDef::new(Tasks::Position)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(Tasks::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .col(
                        ColumnDef::new(Tasks::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Tasks::Table, Tasks::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_tasks_user_date")
                    .table(Tasks::Table)
                    .col(Tasks::UserId)
                    .col(Tasks::TaskDate)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_tasks_date_position")
                    .table(Tasks::Table)
                    .col(Tasks::TaskDate)
                    .col(Tasks::Position)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Tasks::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Tasks {
    Table,
    Id,
    UserId,
    Title,
    Content,
    Priority,
    TaskDate,
    TimeStart,
    TimeEnd,
    Position,
    CreatedAt,
    UpdatedAt,
}
