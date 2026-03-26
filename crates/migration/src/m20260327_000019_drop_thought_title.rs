use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Thoughts::Table)
                    .drop_column(Thoughts::Title)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Thoughts::Table)
                    .add_column(ColumnDef::new(Thoughts::Title).text().not_null().default(""))
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Thoughts {
    Table,
    Title,
}
