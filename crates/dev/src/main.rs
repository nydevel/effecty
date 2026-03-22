#![deny(unsafe_code)]

use std::path::Path;
use std::process::Command;

use anyhow::{bail, Result};
use tracing_subscriber::EnvFilter;

fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let args: Vec<String> = std::env::args().collect();
    let command = args.get(1).map(String::as_str);

    match command {
        Some("--help") | Some("-h") => {
            print_usage();
            Ok(())
        }
        None => dev(),
        Some(cmd) => bail!("unknown command: {cmd}\nRun 'effecty-dev --help' for usage"),
    }
}

fn print_usage() {
    eprintln!("effecty-dev — development helper");
    eprintln!();
    eprintln!("Usage: effecty-dev");
    eprintln!();
    eprintln!("Builds frontend and starts the server. For development only.");
}

fn dev() -> Result<()> {
    build_frontend()?;

    tracing::info!("starting server...");
    run_cmd("cargo", &["run", "-p", "server"])?;
    Ok(())
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

/// Find the nvm-managed node bin directory (e.g. ~/.nvm/versions/node/v22.x.x/bin).
fn find_nvm_node_bin() -> Option<String> {
    let home = std::env::var("HOME").ok()?;
    let versions_dir = Path::new(&home).join(".nvm/versions/node");
    let mut versions: Vec<_> = std::fs::read_dir(&versions_dir)
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
        .collect();

    versions.sort_by_key(|e| std::cmp::Reverse(e.file_name()));

    let bin_dir = versions.first()?.path().join("bin");
    if bin_dir.exists() {
        Some(bin_dir.to_string_lossy().into_owned())
    } else {
        None
    }
}
