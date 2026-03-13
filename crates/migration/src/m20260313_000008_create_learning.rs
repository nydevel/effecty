use sea_orm_migration::prelude::*;

use crate::m20260311_000001_create_users::Users;
use crate::m20260312_000006_create_thoughts::Tags;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // topics
        manager
            .create_table(
                Table::create()
                    .table(Topics::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Topics::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(Topics::UserId).uuid().not_null())
                    .col(ColumnDef::new(Topics::Name).text().not_null().default(""))
                    .col(
                        ColumnDef::new(Topics::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .col(
                        ColumnDef::new(Topics::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Topics::Table, Topics::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_topics_user")
                    .table(Topics::Table)
                    .col(Topics::UserId)
                    .to_owned(),
            )
            .await?;

        // topic_tags (many-to-many: topics <-> tags)
        manager
            .create_table(
                Table::create()
                    .table(TopicTags::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(TopicTags::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(TopicTags::TopicId).uuid().not_null())
                    .col(ColumnDef::new(TopicTags::TagId).uuid().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .from(TopicTags::Table, TopicTags::TopicId)
                            .to(Topics::Table, Topics::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(TopicTags::Table, TopicTags::TagId)
                            .to(Tags::Table, Tags::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_topic_tags_unique")
                    .table(TopicTags::Table)
                    .col(TopicTags::TopicId)
                    .col(TopicTags::TagId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // materials
        manager
            .create_table(
                Table::create()
                    .table(Materials::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Materials::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(Materials::UserId).uuid().not_null())
                    .col(ColumnDef::new(Materials::MaterialType).text().not_null())
                    .col(
                        ColumnDef::new(Materials::Title)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(ColumnDef::new(Materials::Url).text().null())
                    .col(ColumnDef::new(Materials::Content).text().null())
                    .col(ColumnDef::new(Materials::FilePath).text().null())
                    .col(ColumnDef::new(Materials::ThumbnailPath).text().null())
                    .col(
                        ColumnDef::new(Materials::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .col(
                        ColumnDef::new(Materials::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Materials::Table, Materials::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_materials_user")
                    .table(Materials::Table)
                    .col(Materials::UserId)
                    .to_owned(),
            )
            .await?;

        // material_topics (many-to-many: materials <-> topics)
        manager
            .create_table(
                Table::create()
                    .table(MaterialTopics::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(MaterialTopics::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(MaterialTopics::MaterialId).uuid().not_null())
                    .col(ColumnDef::new(MaterialTopics::TopicId).uuid().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .from(MaterialTopics::Table, MaterialTopics::MaterialId)
                            .to(Materials::Table, Materials::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(MaterialTopics::Table, MaterialTopics::TopicId)
                            .to(Topics::Table, Topics::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_material_topics_unique")
                    .table(MaterialTopics::Table)
                    .col(MaterialTopics::MaterialId)
                    .col(MaterialTopics::TopicId)
                    .unique()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(MaterialTopics::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Materials::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(TopicTags::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Topics::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub(crate) enum Topics {
    Table,
    Id,
    UserId,
    Name,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum TopicTags {
    Table,
    Id,
    TopicId,
    TagId,
}

#[derive(DeriveIden)]
enum Materials {
    Table,
    Id,
    UserId,
    MaterialType,
    Title,
    Url,
    Content,
    FilePath,
    ThumbnailPath,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum MaterialTopics {
    Table,
    Id,
    MaterialId,
    TopicId,
}
