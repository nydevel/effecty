#![deny(unsafe_code)]

use std::path::Path;

use anyhow::{bail, Result};
use effecty_core::config::{Config, Environment};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn")),
        )
        .init();

    let args: Vec<String> = std::env::args().collect();
    let command = args.get(1).map(String::as_str);

    match command {
        Some("migrate") => migrate().await,
        Some("seed") => seed().await,
        Some("dev") => dev(),
        Some(cmd) => bail!("unknown command: {cmd}"),
        None => {
            print_usage();
            Ok(())
        }
    }
}

fn print_usage() {
    eprintln!("Usage: cli <command>");
    eprintln!();
    eprintln!("Commands:");
    eprintln!("  dev      Build frontend and start server");
    eprintln!("  migrate  Run database migrations");
    eprintln!("  seed     Create dev user (dev@effecty.org / dev123). Only in dev environment.");
}

fn dev() -> Result<()> {
    use std::process::Command;

    tracing::info!("building frontend...");
    let npm = if cfg!(windows) { "npm.cmd" } else { "npm" };

    let status = Command::new(npm)
        .args(["run", "build"])
        .current_dir("frontend")
        .status()?;

    if !status.success() {
        bail!("frontend build failed");
    }

    tracing::info!("starting server...");
    let status = Command::new("cargo")
        .args(["run", "-p", "server"])
        .status()?;

    if !status.success() {
        bail!("server exited with error");
    }

    Ok(())
}

async fn migrate() -> Result<()> {
    let config = Config::load(Path::new("configuration.toml"))?;
    db::run_migrations(&config.database.url).await?;
    tracing::info!("migrations complete");
    Ok(())
}

async fn seed() -> Result<()> {
    let config = Config::load(Path::new("configuration.toml"))?;

    if config.app.environment != Environment::Dev {
        bail!(
            "seed is only allowed in dev environment (current: {})",
            config.app.environment
        );
    }

    db::run_migrations(&config.database.url).await?;
    let pool = db::create_pool(&config.database).await?;

    let email = "dev@effecty.org";
    let password = "dev123";

    let existing = db::repo::users::find_by_email(&pool, email).await?;
    if existing.is_some() {
        tracing::info!(email, "user already exists, skipping");
        return Ok(());
    }

    let hash = db::password::hash(password)?;
    let user = db::repo::users::create(&pool, email, &hash).await?;

    tracing::info!(email, id = %user.id, "dev user created");
    Ok(())
}
