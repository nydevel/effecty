use sea_orm_migration::prelude::*;

use crate::m20260311_000001_create_users::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // tags (generic, reusable across features)
        manager
            .create_table(
                Table::create()
                    .table(Tags::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Tags::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Tags::UserId).uuid().not_null())
                    .col(ColumnDef::new(Tags::Name).text().not_null().default(""))
                    .col(
                        ColumnDef::new(Tags::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .col(
                        ColumnDef::new(Tags::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Tags::Table, Tags::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_tags_user")
                    .table(Tags::Table)
                    .col(Tags::UserId)
                    .to_owned(),
            )
            .await?;

        // thoughts
        manager
            .create_table(
                Table::create()
                    .table(Thoughts::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Thoughts::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Thoughts::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(Thoughts::Title)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Thoughts::Content)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Thoughts::Position)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(Thoughts::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .col(
                        ColumnDef::new(Thoughts::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Thoughts::Table, Thoughts::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_thoughts_user")
                    .table(Thoughts::Table)
                    .col(Thoughts::UserId)
                    .to_owned(),
            )
            .await?;

        // thought_comments
        manager
            .create_table(
                Table::create()
                    .table(ThoughtComments::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ThoughtComments::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ThoughtComments::ThoughtId).uuid().not_null())
                    .col(ColumnDef::new(ThoughtComments::UserId).uuid().not_null())
                    .col(ColumnDef::new(ThoughtComments::Content).text().not_null())
                    .col(
                        ColumnDef::new(ThoughtComments::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .col(
                        ColumnDef::new(ThoughtComments::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ThoughtComments::Table, ThoughtComments::ThoughtId)
                            .to(Thoughts::Table, Thoughts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ThoughtComments::Table, ThoughtComments::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_thought_comments_thought")
                    .table(ThoughtComments::Table)
                    .col(ThoughtComments::ThoughtId)
                    .to_owned(),
            )
            .await?;

        // thought_tags (many-to-many junction)
        manager
            .create_table(
                Table::create()
                    .table(ThoughtTags::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ThoughtTags::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ThoughtTags::ThoughtId).uuid().not_null())
                    .col(ColumnDef::new(ThoughtTags::TagId).uuid().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .from(ThoughtTags::Table, ThoughtTags::ThoughtId)
                            .to(Thoughts::Table, Thoughts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ThoughtTags::Table, ThoughtTags::TagId)
                            .to(Tags::Table, Tags::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_thought_tags_unique")
                    .table(ThoughtTags::Table)
                    .col(ThoughtTags::ThoughtId)
                    .col(ThoughtTags::TagId)
                    .unique()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ThoughtTags::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(ThoughtComments::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Thoughts::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Tags::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub(crate) enum Tags {
    Table,
    Id,
    UserId,
    Name,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Thoughts {
    Table,
    Id,
    UserId,
    Title,
    Content,
    Position,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum ThoughtComments {
    Table,
    Id,
    ThoughtId,
    UserId,
    Content,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum ThoughtTags {
    Table,
    Id,
    ThoughtId,
    TagId,
}
