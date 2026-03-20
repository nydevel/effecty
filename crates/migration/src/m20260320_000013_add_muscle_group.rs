use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Exercises::Table)
                    .add_column(ColumnDef::new(Exercises::MuscleGroup).string_len(32).null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Exercises::Table)
                    .drop_column(Exercises::MuscleGroup)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Exercises {
    Table,
    MuscleGroup,
}
