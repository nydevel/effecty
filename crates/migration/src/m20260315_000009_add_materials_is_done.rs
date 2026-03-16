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
                    .table(UserMaterials::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(UserMaterials::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(UserMaterials::UserId).uuid().not_null())
                    .col(ColumnDef::new(UserMaterials::MaterialId).uuid().not_null())
                    .col(
                        ColumnDef::new(UserMaterials::IsDone)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(
                        ColumnDef::new(UserMaterials::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .col(
                        ColumnDef::new(UserMaterials::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(UserMaterials::Table, UserMaterials::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(UserMaterials::Table, UserMaterials::MaterialId)
                            .to(Materials::Table, Materials::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_user_materials_unique")
                    .table(UserMaterials::Table)
                    .col(UserMaterials::UserId)
                    .col(UserMaterials::MaterialId)
                    .unique()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UserMaterials::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum UserMaterials {
    Table,
    Id,
    UserId,
    MaterialId,
    IsDone,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Materials {
    Table,
    Id,
}
