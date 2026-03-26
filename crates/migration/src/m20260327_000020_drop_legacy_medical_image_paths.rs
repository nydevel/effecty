use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(DoctorVisits::Table)
                    .drop_column(DoctorVisits::ImagePath)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Analyses::Table)
                    .drop_column(Analyses::ImagePath)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(DoctorVisits::Table)
                    .add_column(ColumnDef::new(DoctorVisits::ImagePath).text().null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Analyses::Table)
                    .add_column(ColumnDef::new(Analyses::ImagePath).text().null())
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum DoctorVisits {
    Table,
    ImagePath,
}

#[derive(DeriveIden)]
enum Analyses {
    Table,
    ImagePath,
}
