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
                    .table(FeatureSettings::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(FeatureSettings::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(FeatureSettings::UserId).uuid().not_null())
                    .col(ColumnDef::new(FeatureSettings::Feature).text().not_null())
                    .col(
                        ColumnDef::new(FeatureSettings::Settings)
                            .text()
                            .not_null()
                            .default("{}"),
                    )
                    .col(
                        ColumnDef::new(FeatureSettings::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .col(
                        ColumnDef::new(FeatureSettings::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(FeatureSettings::Table, FeatureSettings::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_feature_settings_user")
                    .table(FeatureSettings::Table)
                    .col(FeatureSettings::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_feature_settings_unique")
                    .table(FeatureSettings::Table)
                    .col(FeatureSettings::UserId)
                    .col(FeatureSettings::Feature)
                    .unique()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(FeatureSettings::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum FeatureSettings {
    Table,
    Id,
    UserId,
    Feature,
    Settings,
    CreatedAt,
    UpdatedAt,
}
