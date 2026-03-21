#![deny(unsafe_code)]

use std::path::{Path, PathBuf};
use std::process::Command;

use anyhow::{bail, Result};
use effecty_core::config::{Config, Environment};
use tracing_subscriber::EnvFilter;

struct Args {
    config_path: PathBuf,
    command: Option<String>,
    extra: Vec<String>,
}

fn parse_args() -> Args {
    let args: Vec<String> = std::env::args().collect();
    let mut config_path = PathBuf::from("configuration.toml");
    let mut command = None;
    let mut extra = Vec::new();
    let mut i = 1;

    #[allow(unused_labels)]
    'args: while i < args.len() {
        match args[i].as_str() {
            "--config" | "-c" => {
                if let Some(path) = args.get(i + 1) {
                    config_path = PathBuf::from(path);
                    i += 2;
                    continue;
                }
                eprintln!("error: --config requires a path argument");
                std::process::exit(1);
            }
            arg if arg.starts_with("--config=") => {
                config_path = PathBuf::from(arg.trim_start_matches("--config="));
            }
            arg if !arg.starts_with('-') && command.is_none() => {
                command = Some(arg.to_string());
            }
            arg if !arg.starts_with('-') && command.is_some() => {
                extra.push(arg.to_string());
            }
            _ => {}
        }
        i += 1;
    }

    Args {
        config_path,
        command,
        extra,
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn")),
        )
        .init();

    let args = parse_args();

    match args.command.as_deref() {
        Some("migrate") => migrate(&args.config_path).await,
        Some("seed") => seed(&args.config_path).await,
        Some("dev") => dev(),
        Some("deploy") => deploy(&args.extra),
        Some(cmd) => bail!("unknown command: {cmd}"),
        None => {
            print_usage();
            Ok(())
        }
    }
}

fn print_usage() {
    eprintln!("Usage: cli [--config <path>] <command> [args]");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  -c, --config <path>  Path to configuration file (default: configuration.toml)");
    eprintln!();
    eprintln!("Commands:");
    eprintln!("  dev                  Build frontend and start server");
    eprintln!("  migrate              Run database migrations");
    eprintln!("  seed                 Create dev user (dev env only)");
    eprintln!("  deploy <user@host>   Build, package, and deploy to remote server");
}

fn run_cmd(program: &str, args: &[&str]) -> Result<()> {
    let cmd_str = format!("{program} {}", args.join(" "));
    tracing::info!(cmd = cmd_str.as_str(), "running");

    let status = Command::new(program).args(args).status()?;
    if !status.success() {
        bail!("{cmd_str} failed with {status}");
    }
    Ok(())
}

fn run_cmd_output(program: &str, args: &[&str]) -> Result<String> {
    let output = Command::new(program).args(args).output()?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        bail!("{program} failed: {stderr}");
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn npm_command() -> Command {
    let npm = if cfg!(windows) { "npm.cmd" } else { "npm" };
    let mut cmd = Command::new(npm);

    if cfg!(target_os = "linux") {
        if let Some(node_path) = find_nvm_node_bin() {
            let current_path = std::env::var("PATH").unwrap_or_default();
            cmd.env("PATH", format!("{node_path}:{current_path}"));
        }
    }

    cmd
}

fn build_frontend() -> Result<()> {
    tracing::info!("building frontend...");

    let status = npm_command()
        .args(["ci"])
        .current_dir("frontend")
        .status()?;
    if !status.success() {
        bail!("npm ci failed");
    }

    let status = npm_command()
        .args(["run", "build"])
        .current_dir("frontend")
        .status()?;
    if !status.success() {
        bail!("frontend build failed");
    }

    Ok(())
}

fn deploy(extra: &[String]) -> Result<()> {
    let target = extra.first().ok_or_else(|| {
        anyhow::anyhow!("Usage: cli deploy <user@host>\nExample: cli deploy root@192.168.1.10")
    })?;

    tracing::info!("deploying to {target}");

    // 1. Build frontend
    build_frontend()?;

    // 2. Touch source files to force rebuild, then build release
    tracing::info!("building release binary...");
    let _ = Command::new("find")
        .args(["crates/", "-name", "*.rs", "-exec", "touch", "{}", "+"])
        .status();
    run_cmd("cargo", &["build", "--release", "-p", "server"])?;

    // 3. Build deb package
    tracing::info!("building deb package...");
    run_cmd("cargo", &["deb", "-p", "server", "--no-build"])?;

    // 4. Find the latest .deb
    let deb = run_cmd_output("sh", &["-c", "ls -t target/debian/*.deb | head -1"])?;
    if deb.is_empty() {
        bail!("no .deb package found in target/debian/");
    }
    tracing::info!("package: {deb}");

    // 5. Upload and install
    tracing::info!("uploading to {target}...");
    run_cmd("scp", &[&deb, &format!("{target}:/tmp/effecty.deb")])?;

    tracing::info!("installing on {target}...");
    run_cmd(
        "ssh",
        &[
            target,
            "DEBIAN_FRONTEND=noninteractive dpkg --force-confold -i /tmp/effecty.deb && systemctl restart effecty && rm /tmp/effecty.deb",
        ],
    )?;

    // 6. Verify
    tracing::info!("verifying...");
    let status = run_cmd_output("ssh", &[target, "systemctl is-active effecty"])?;
    tracing::info!("service status: {status}");

    tracing::info!("deploy complete");
    Ok(())
}

fn dev() -> Result<()> {
    build_frontend()?;

    tracing::info!("starting server...");
    run_cmd("cargo", &["run", "-p", "server"])?;
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

async fn migrate(config_path: &Path) -> Result<()> {
    let config = Config::load(config_path)?;
    db::run_migrations(&config.database.url).await?;
    tracing::info!("migrations complete");
    Ok(())
}

async fn seed(config_path: &Path) -> Result<()> {
    let config = Config::load(config_path)?;

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
