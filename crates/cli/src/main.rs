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
    eprintln!("  seed     Create dev user (nydevel@effecty.org / dev123). Only in dev environment.");
}

fn dev() -> Result<()> {
    use std::process::Command;

    tracing::info!("building frontend...");

    let npm = if cfg!(windows) { "npm.cmd" } else { "npm" };
    let mut cmd = Command::new(npm);
    cmd.args(["run", "build"]).current_dir("frontend");

    // In WSL, Windows PATH entries (/mnt/c/...) can shadow Linux node/npm.
    // Prepend nvm node bin directory so the correct binaries are found.
    if cfg!(target_os = "linux") {
        if let Some(node_path) = find_nvm_node_bin() {
            let current_path = std::env::var("PATH").unwrap_or_default();
            cmd.env("PATH", format!("{node_path}:{current_path}"));
        }
    }

    let status = cmd.status()?;

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

/// Find the nvm-managed node bin directory (e.g. ~/.nvm/versions/node/v22.x.x/bin).
/// Returns the path of the latest installed version, or None if nvm is not present.
fn find_nvm_node_bin() -> Option<String> {
    let home = std::env::var("HOME").ok()?;
    let versions_dir = Path::new(&home).join(".nvm/versions/node");
    let mut versions: Vec<_> = std::fs::read_dir(&versions_dir)
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
        .collect();

    // Sort by name descending so newest version comes first
    versions.sort_by_key(|e| std::cmp::Reverse(e.file_name()));

    let bin_dir = versions.first()?.path().join("bin");
    if bin_dir.exists() {
        Some(bin_dir.to_string_lossy().into_owned())
    } else {
        None
    }
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

    let email = "nydevel@effecty.org";
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
