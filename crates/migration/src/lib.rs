#![deny(unsafe_code)]

pub use sea_orm_migration::prelude::*;

mod m20260311_000001_create_users;
mod m20260311_000002_create_notes;
mod m20260311_000003_create_tasks;
mod m20260312_000004_create_workouts;
mod m20260312_000005_create_user_profiles;
mod m20260312_000006_create_thoughts;
mod m20260313_000007_tags_unique_name;
mod m20260313_000008_create_learning;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260311_000001_create_users::Migration),
            Box::new(m20260311_000002_create_notes::Migration),
            Box::new(m20260311_000003_create_tasks::Migration),
            Box::new(m20260312_000004_create_workouts::Migration),
            Box::new(m20260312_000005_create_user_profiles::Migration),
            Box::new(m20260312_000006_create_thoughts::Migration),
            Box::new(m20260313_000007_tags_unique_name::Migration),
            Box::new(m20260313_000008_create_learning::Migration),
        ]
    }
}
