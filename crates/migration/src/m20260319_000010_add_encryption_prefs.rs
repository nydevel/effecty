use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(UserProfiles::Table)
                    .add_column(
                        ColumnDef::new(UserProfiles::EncryptNotes)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(UserProfiles::Table)
                    .add_column(
                        ColumnDef::new(UserProfiles::EncryptThoughts)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(UserProfiles::Table)
                    .drop_column(UserProfiles::EncryptNotes)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(UserProfiles::Table)
                    .drop_column(UserProfiles::EncryptThoughts)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum UserProfiles {
    Table,
    EncryptNotes,
    EncryptThoughts,
}
