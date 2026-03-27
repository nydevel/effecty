use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Topics::Table)
                    .add_column(ColumnDef::new(Topics::ParentId).uuid().null())
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_topics_parent")
                    .table(Topics::Table)
                    .col(Topics::ParentId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_index(
                Index::drop()
                    .name("idx_topics_parent")
                    .table(Topics::Table)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Topics::Table)
                    .drop_column(Topics::ParentId)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Topics {
    Table,
    ParentId,
}
