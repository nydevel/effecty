#![deny(unsafe_code)]

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Projects
        manager
            .create_table(
                Table::create()
                    .table(Projects::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Projects::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Projects::UserId).uuid().not_null())
                    .col(ColumnDef::new(Projects::Name).text().not_null().default(""))
                    .col(
                        ColumnDef::new(Projects::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Projects::UpdatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Projects::Table, Projects::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_projects_user")
                    .table(Projects::Table)
                    .col(Projects::UserId)
                    .to_owned(),
            )
            .await?;

        // Project tasks
        manager
            .create_table(
                Table::create()
                    .table(ProjectTasks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ProjectTasks::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ProjectTasks::ProjectId).uuid().not_null())
                    .col(ColumnDef::new(ProjectTasks::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(ProjectTasks::Title)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(ProjectTasks::Description)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(ProjectTasks::Status)
                            .text()
                            .not_null()
                            .default("todo"),
                    )
                    .col(
                        ColumnDef::new(ProjectTasks::Position)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(ProjectTasks::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(ProjectTasks::UpdatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ProjectTasks::Table, ProjectTasks::ProjectId)
                            .to(Projects::Table, Projects::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ProjectTasks::Table, ProjectTasks::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_project_tasks_project")
                    .table(ProjectTasks::Table)
                    .col(ProjectTasks::ProjectId)
                    .to_owned(),
            )
            .await?;

        // Project task links
        manager
            .create_table(
                Table::create()
                    .table(ProjectTaskLinks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ProjectTaskLinks::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(ProjectTaskLinks::SourceTaskId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(ProjectTaskLinks::TargetTaskId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(ProjectTaskLinks::LinkType)
                            .text()
                            .not_null()
                            .default("related"),
                    )
                    .col(ColumnDef::new(ProjectTaskLinks::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(ProjectTaskLinks::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ProjectTaskLinks::Table, ProjectTaskLinks::SourceTaskId)
                            .to(ProjectTasks::Table, ProjectTasks::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ProjectTaskLinks::Table, ProjectTaskLinks::TargetTaskId)
                            .to(ProjectTasks::Table, ProjectTasks::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ProjectTaskLinks::Table, ProjectTaskLinks::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_project_task_links_source")
                    .table(ProjectTaskLinks::Table)
                    .col(ProjectTaskLinks::SourceTaskId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_project_task_links_unique")
                    .table(ProjectTaskLinks::Table)
                    .col(ProjectTaskLinks::SourceTaskId)
                    .col(ProjectTaskLinks::TargetTaskId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ProjectTaskLinks::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(ProjectTasks::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Projects::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
enum Users {
    Table,
    Id,
}

#[derive(Iden)]
enum Projects {
    Table,
    Id,
    UserId,
    Name,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum ProjectTasks {
    Table,
    Id,
    ProjectId,
    UserId,
    Title,
    Description,
    Status,
    Position,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum ProjectTaskLinks {
    Table,
    Id,
    SourceTaskId,
    TargetTaskId,
    LinkType,
    UserId,
    CreatedAt,
}
