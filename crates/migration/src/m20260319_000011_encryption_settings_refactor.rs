use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Add encryption_settings JSONB to user_profiles
        manager
            .alter_table(
                Table::alter()
                    .table(UserProfiles::Table)
                    .add_column(
                        ColumnDef::new(UserProfiles::EncryptionSettings)
                            .json_binary()
                            .not_null()
                            .default("{}"),
                    )
                    .to_owned(),
            )
            .await?;

        // 2. Backfill encryption_settings from old boolean columns
        let db = manager.get_connection();
        db.execute_unprepared(
            r#"
            UPDATE user_profiles SET encryption_settings = jsonb_build_object(
                'notes', jsonb_build_object('title', encrypt_notes, 'content', encrypt_notes),
                'memos', jsonb_build_object('title', encrypt_notes, 'content', encrypt_notes),
                'thoughts', jsonb_build_object('title', encrypt_thoughts, 'content', encrypt_thoughts),
                'thought_comments', jsonb_build_object('content', encrypt_thoughts)
            )
            "#,
        )
        .await?;

        // 3. Drop old boolean columns
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
            .await?;

        // 4. Add is_encrypted to notes
        manager
            .alter_table(
                Table::alter()
                    .table(Notes::Table)
                    .add_column(
                        ColumnDef::new(Notes::IsEncrypted)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await?;

        // 5. Add is_encrypted to memos
        manager
            .alter_table(
                Table::alter()
                    .table(Memos::Table)
                    .add_column(
                        ColumnDef::new(Memos::IsEncrypted)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await?;

        // 6. Add is_encrypted to thoughts
        manager
            .alter_table(
                Table::alter()
                    .table(Thoughts::Table)
                    .add_column(
                        ColumnDef::new(Thoughts::IsEncrypted)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await?;

        // 7. Add is_encrypted to thought_comments
        manager
            .alter_table(
                Table::alter()
                    .table(ThoughtComments::Table)
                    .add_column(
                        ColumnDef::new(ThoughtComments::IsEncrypted)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await?;

        // 8. Backfill is_encrypted based on ENC: prefix in existing data
        db.execute_unprepared(
            "UPDATE notes SET is_encrypted = true WHERE title LIKE 'ENC:%' OR content LIKE 'ENC:%'",
        )
        .await?;

        db.execute_unprepared(
            "UPDATE memos SET is_encrypted = true WHERE title LIKE 'ENC:%' OR content LIKE 'ENC:%'",
        )
        .await?;

        db.execute_unprepared(
            "UPDATE thoughts SET is_encrypted = true WHERE title LIKE 'ENC:%' OR content LIKE 'ENC:%'",
        )
        .await?;

        db.execute_unprepared(
            "UPDATE thought_comments SET is_encrypted = true WHERE content LIKE 'ENC:%'",
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop is_encrypted from all tables
        manager
            .alter_table(
                Table::alter()
                    .table(ThoughtComments::Table)
                    .drop_column(ThoughtComments::IsEncrypted)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Thoughts::Table)
                    .drop_column(Thoughts::IsEncrypted)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Memos::Table)
                    .drop_column(Memos::IsEncrypted)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Notes::Table)
                    .drop_column(Notes::IsEncrypted)
                    .to_owned(),
            )
            .await?;

        // Re-add old boolean columns
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
            .await?;

        // Drop encryption_settings
        manager
            .alter_table(
                Table::alter()
                    .table(UserProfiles::Table)
                    .drop_column(UserProfiles::EncryptionSettings)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum UserProfiles {
    Table,
    EncryptionSettings,
    EncryptNotes,
    EncryptThoughts,
}

#[derive(DeriveIden)]
enum Notes {
    Table,
    IsEncrypted,
}

#[derive(DeriveIden)]
enum Memos {
    Table,
    IsEncrypted,
}

#[derive(DeriveIden)]
enum Thoughts {
    Table,
    IsEncrypted,
}

#[derive(DeriveIden)]
enum ThoughtComments {
    Table,
    IsEncrypted,
}
