use sea_orm_migration::prelude::*;

use crate::m20260311_000001_create_users::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // exercises catalog
        manager
            .create_table(
                Table::create()
                    .table(Exercises::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Exercises::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(Exercises::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(Exercises::Name)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Exercises::SortOrder)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(Exercises::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .col(
                        ColumnDef::new(Exercises::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Exercises::Table, Exercises::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_exercises_user")
                    .table(Exercises::Table)
                    .col(Exercises::UserId)
                    .col(Exercises::SortOrder)
                    .to_owned(),
            )
            .await?;

        // workouts
        manager
            .create_table(
                Table::create()
                    .table(Workouts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Workouts::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(ColumnDef::new(Workouts::UserId).uuid().not_null())
                    .col(ColumnDef::new(Workouts::WorkoutDate).date().not_null())
                    .col(
                        ColumnDef::new(Workouts::Position)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(Workouts::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .col(
                        ColumnDef::new(Workouts::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Workouts::Table, Workouts::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_workouts_user_date")
                    .table(Workouts::Table)
                    .col(Workouts::UserId)
                    .col(Workouts::WorkoutDate)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_workouts_user_position")
                    .table(Workouts::Table)
                    .col(Workouts::UserId)
                    .col(Workouts::Position)
                    .to_owned(),
            )
            .await?;

        // workout_exercises junction
        manager
            .create_table(
                Table::create()
                    .table(WorkoutExercises::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(WorkoutExercises::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(
                        ColumnDef::new(WorkoutExercises::WorkoutId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(WorkoutExercises::ExerciseId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(WorkoutExercises::Sets)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(WorkoutExercises::Reps)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(WorkoutExercises::Weight)
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(WorkoutExercises::Position)
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(WorkoutExercises::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .col(
                        ColumnDef::new(WorkoutExercises::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .extra("DEFAULT NOW()"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(WorkoutExercises::Table, WorkoutExercises::WorkoutId)
                            .to(Workouts::Table, Workouts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(WorkoutExercises::Table, WorkoutExercises::ExerciseId)
                            .to(Exercises::Table, Exercises::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_we_workout")
                    .table(WorkoutExercises::Table)
                    .col(WorkoutExercises::WorkoutId)
                    .col(WorkoutExercises::Position)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_we_workout_exercise")
                    .table(WorkoutExercises::Table)
                    .col(WorkoutExercises::WorkoutId)
                    .col(WorkoutExercises::ExerciseId)
                    .unique()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(WorkoutExercises::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Workouts::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Exercises::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Exercises {
    Table,
    Id,
    UserId,
    Name,
    SortOrder,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Workouts {
    Table,
    Id,
    UserId,
    WorkoutDate,
    Position,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum WorkoutExercises {
    Table,
    Id,
    WorkoutId,
    ExerciseId,
    Sets,
    Reps,
    Weight,
    Position,
    CreatedAt,
    UpdatedAt,
}
