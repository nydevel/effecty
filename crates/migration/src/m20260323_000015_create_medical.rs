use sea_orm_migration::prelude::*;

use crate::m20260311_000001_create_users::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // medical_specialties
        manager
            .create_table(
                Table::create()
                    .table(MedicalSpecialties::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(MedicalSpecialties::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(MedicalSpecialties::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(MedicalSpecialties::Name)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(MedicalSpecialties::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .col(
                        ColumnDef::new(MedicalSpecialties::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(MedicalSpecialties::Table, MedicalSpecialties::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_medical_specialties_user")
                    .table(MedicalSpecialties::Table)
                    .col(MedicalSpecialties::UserId)
                    .to_owned(),
            )
            .await?;

        // doctor_visits
        manager
            .create_table(
                Table::create()
                    .table(DoctorVisits::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(DoctorVisits::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(DoctorVisits::UserId).uuid().not_null())
                    .col(ColumnDef::new(DoctorVisits::SpecialtyId).uuid().not_null())
                    .col(
                        ColumnDef::new(DoctorVisits::DoctorName)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(DoctorVisits::Clinic)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(DoctorVisits::VisitDate)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(DoctorVisits::Notes)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(ColumnDef::new(DoctorVisits::ImagePath).text().null())
                    .col(
                        ColumnDef::new(DoctorVisits::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .col(
                        ColumnDef::new(DoctorVisits::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(DoctorVisits::Table, DoctorVisits::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(DoctorVisits::Table, DoctorVisits::SpecialtyId)
                            .to(MedicalSpecialties::Table, MedicalSpecialties::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_doctor_visits_user")
                    .table(DoctorVisits::Table)
                    .col(DoctorVisits::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_doctor_visits_specialty")
                    .table(DoctorVisits::Table)
                    .col(DoctorVisits::SpecialtyId)
                    .to_owned(),
            )
            .await?;

        // analyses
        manager
            .create_table(
                Table::create()
                    .table(Analyses::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Analyses::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Analyses::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(Analyses::Title)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Analyses::AnalysisDate)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Analyses::Notes)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(ColumnDef::new(Analyses::ImagePath).text().null())
                    .col(
                        ColumnDef::new(Analyses::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .col(
                        ColumnDef::new(Analyses::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT (datetime('now'))"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Analyses::Table, Analyses::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_analyses_user")
                    .table(Analyses::Table)
                    .col(Analyses::UserId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Analyses::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(DoctorVisits::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(MedicalSpecialties::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum MedicalSpecialties {
    Table,
    Id,
    UserId,
    Name,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum DoctorVisits {
    Table,
    Id,
    UserId,
    SpecialtyId,
    DoctorName,
    Clinic,
    VisitDate,
    Notes,
    ImagePath,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Analyses {
    Table,
    Id,
    UserId,
    Title,
    AnalysisDate,
    Notes,
    ImagePath,
    CreatedAt,
    UpdatedAt,
}
