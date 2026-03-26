#![warn(unsafe_code)]

use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

use anyhow::{bail, Result};
use effecty_core::config::Config;
use tracing_subscriber::EnvFilter;

const REMOTE_CONFIG: &str = "/etc/effecty/configuration.toml";

struct Args {
    config_path: PathBuf,
    config_explicit: bool,
    remote: Option<String>,
    command: Option<String>,
    extra: Vec<String>,
}

fn parse_args() -> Args {
    let args: Vec<String> = std::env::args().collect();
    let mut config_path = PathBuf::from("configuration.toml");
    let mut config_explicit = false;
    let mut remote = None;
    let mut command = None;
    let mut extra = Vec::new();
    let mut i = 1;

    #[allow(unused_labels)]
    'args: while i < args.len() {
        match args[i].as_str() {
            "--config" | "-c" => {
                if let Some(path) = args.get(i + 1) {
                    config_path = PathBuf::from(path);
                    config_explicit = true;
                    i += 2;
                    continue;
                }
                eprintln!("error: --config requires a path argument");
                std::process::exit(1);
            }
            arg if arg.starts_with("--config=") => {
                config_path = PathBuf::from(arg.trim_start_matches("--config="));
                config_explicit = true;
            }
            "--remote" | "-r" => {
                if let Some(host) = args.get(i + 1) {
                    remote = Some(host.clone());
                    i += 2;
                    continue;
                }
                eprintln!("error: --remote requires a user@host argument");
                std::process::exit(1);
            }
            arg if arg.starts_with("--remote=") => {
                remote = Some(arg.trim_start_matches("--remote=").to_string());
            }
            "--help" | "-h" => {
                print_usage();
                std::process::exit(0);
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
        config_explicit,
        remote,
        command,
        extra,
    }
}

fn print_usage() {
    eprintln!("effecty-cli — administration and deployment tool");
    eprintln!();
    eprintln!("Usage: effecty-cli [options] <command> [args]");
    eprintln!();
    eprintln!("Options:");
    eprintln!(
        "  -c, --config <path>        Path to configuration file (default: configuration.toml)"
    );
    eprintln!("  -r, --remote <user@host>   Execute command on remote server via SSH");
    eprintln!("  -h, --help                 Show this help message");
    eprintln!();
    eprintln!("Commands:");
    eprintln!("  create-user <login>        Create a new user (prompts for password)");
    eprintln!("  deploy <user@host>         Build, package, and deploy to remote server");
    eprintln!("                             (auto-detects remote architecture via SSH)");
    eprintln!();
    eprintln!("Examples:");
    eprintln!("  effecty-cli create-user admin                          # local");
    eprintln!("  effecty-cli -r root@server create-user admin           # remote via SSH");
    eprintln!("  effecty-cli deploy root@server                         # build and deploy");
    eprintln!("  effecty-cli -c prod.toml deploy root@server             # deploy with config");
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn")),
        )
        .init();

    let args = parse_args();

    // If --remote is set, forward the command via SSH
    if let Some(ref host) = args.remote {
        return run_remote(host, &args);
    }

    match args.command.as_deref() {
        Some("create-user") => create_user(&args.config_path, &args.extra).await,
        Some("deploy") => {
            let config = if args.config_explicit {
                Some(args.config_path.as_path())
            } else {
                None
            };
            deploy(&args.extra, config)
        }
        Some(cmd) => bail!("unknown command: {cmd}\nRun 'effecty-cli --help' for usage"),
        None => {
            print_usage();
            Ok(())
        }
    }
}

// --- remote execution ---

fn run_remote(host: &str, args: &Args) -> Result<()> {
    let command = args
        .command
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("no command specified for remote execution"))?;

    if command == "deploy" {
        bail!("deploy cannot be used with --remote (it already handles remote deployment)");
    }

    let mut remote_cmd = format!("effecty-cli --config {REMOTE_CONFIG} {command}");
    for arg in &args.extra {
        remote_cmd.push(' ');
        remote_cmd.push_str(arg);
    }

    tracing::info!(host, cmd = remote_cmd.as_str(), "executing on remote");

    let status = Command::new("ssh")
        .args(["-t", host, &remote_cmd])
        .status()?;

    if !status.success() {
        bail!("remote command failed with {status}");
    }

    Ok(())
}

// --- create-user ---

async fn create_user(config_path: &Path, extra: &[String]) -> Result<()> {
    let login = extra.first().ok_or_else(|| {
        anyhow::anyhow!(
            "Usage: effecty-cli create-user <login>\nExample: effecty-cli create-user admin"
        )
    })?;

    let password = read_password("Password: ")?;
    if password.is_empty() {
        bail!("password cannot be empty");
    }

    let password_confirm = read_password("Confirm password: ")?;
    if password != password_confirm {
        bail!("passwords do not match");
    }

    let config = Config::load(config_path)?;
    db::run_migrations(&config.database.url).await?;
    let pool = db::create_pool(&config.database).await?;

    let existing = db::repo::users::find_by_email(&pool, login).await?;
    if existing.is_some() {
        bail!("user '{login}' already exists");
    }

    let hash = db::password::hash(&password)?;
    let user = db::repo::users::create(&pool, login, &hash).await?;

    tracing::info!(login, id = %user.id, "user created");
    Ok(())
}

fn read_password(prompt: &str) -> Result<String> {
    eprint!("{prompt}");
    std::io::stderr().flush()?;

    let password = read_line_no_echo()?;
    eprintln!();
    Ok(password)
}

/// Read a line from stdin with echo disabled (Unix only).
#[allow(unsafe_code)]
fn read_line_no_echo() -> Result<String> {
    #[cfg(unix)]
    {
        use std::io::BufRead;
        use std::os::unix::io::AsRawFd;

        let stdin = std::io::stdin();
        let fd = stdin.as_raw_fd();

        // SAFETY: termios operations on a valid stdin fd are safe
        let old_termios = unsafe {
            let mut termios = std::mem::zeroed::<libc::termios>();
            libc::tcgetattr(fd, &mut termios);
            termios
        };

        // Disable echo
        unsafe {
            let mut termios = old_termios;
            termios.c_lflag &= !libc::ECHO;
            libc::tcsetattr(fd, libc::TCSANOW, &termios);
        }

        let mut line = String::new();
        let result = stdin.lock().read_line(&mut line);

        // Restore terminal
        unsafe {
            libc::tcsetattr(fd, libc::TCSANOW, &old_termios);
        }

        result?;
        Ok(line.trim_end().to_string())
    }

    #[cfg(not(unix))]
    {
        use std::io::BufRead;
        let mut line = String::new();
        std::io::stdin().lock().read_line(&mut line)?;
        Ok(line.trim_end().to_string())
    }
}

// --- deploy ---

fn deploy(extra: &[String], config: Option<&Path>) -> Result<()> {
    let target = extra.first().ok_or_else(|| {
        anyhow::anyhow!(
            "Usage: effecty-cli deploy <user@host>\nExample: effecty-cli deploy root@192.168.1.10"
        )
    })?;

    if let Some(cfg) = config {
        if !cfg.exists() {
            bail!("config file not found: {}", cfg.display());
        }
    }

    tracing::info!("deploying to {target}");

    // 1. Detect remote architecture
    tracing::info!("detecting remote architecture...");
    let remote_arch = run_cmd_output("ssh", &[target, "uname -m"])?;
    let docker_platform = match remote_arch.as_str() {
        "x86_64" => "linux/amd64",
        "aarch64" | "arm64" => "linux/arm64",
        other => bail!("unsupported remote architecture: {other}"),
    };
    tracing::info!("remote arch: {remote_arch} -> docker platform: {docker_platform}");

    // 2. Build .deb package via Docker
    tracing::info!("building packages via Docker...");
    run_cmd(
        "docker",
        &[
            "build",
            "--platform", docker_platform,
            "-f", "infra/Dockerfile.build",
            "--target", "export",
            "--output", "target/packages",
            ".",
        ],
    )?;

    // 2. Find the .deb
    let deb = run_cmd_output("sh", &["-c", "ls -t target/packages/*.deb | head -1"])?;
    if deb.is_empty() {
        bail!("no .deb package found in target/packages/");
    }
    tracing::info!("package: {deb}");

    // 5. Upload and install
    tracing::info!("uploading to {target}...");
    run_cmd(
        "rsync",
        &["-avz", "--progress", "--partial", &deb, &format!("{target}:/tmp/effecty.deb")],
    )?;

    tracing::info!("installing on {target}...");
    run_cmd(
        "ssh",
        &[
            target,
            "DEBIAN_FRONTEND=noninteractive dpkg --force-confold -i /tmp/effecty.deb && rm /tmp/effecty.deb",
        ],
    )?;

    // 6. Upload config if specified
    if let Some(cfg) = config {
        let cfg_str = cfg.to_string_lossy();
        tracing::info!(config = %cfg_str, "uploading config to {target}...");
        run_cmd("rsync", &["-avz", "--progress", &cfg_str, &format!("{target}:{REMOTE_CONFIG}")])?;
    }

    // 7. Generate jwt_secret if it's still the default placeholder
    tracing::info!("checking jwt_secret...");
    let generate_secret_cmd = format!(
        "grep -q 'jwt_secret = \"change-me-in-production\"' {REMOTE_CONFIG} && \
         sed -i 's/jwt_secret = \"change-me-in-production\"/jwt_secret = \"'$(openssl rand -base64 32)'\"/' {REMOTE_CONFIG} && \
         echo GENERATED || echo OK"
    );
    let secret_status = run_cmd_output("ssh", &[target, &generate_secret_cmd])?;
    if secret_status == "GENERATED" {
        tracing::info!("jwt_secret generated on {target}");
    }

    // 8. Restart service
    tracing::info!("restarting service...");
    run_cmd("ssh", &[target, "systemctl restart effecty"])?;

    // 9. Verify
    tracing::info!("verifying...");
    let status = run_cmd_output("ssh", &[target, "systemctl is-active effecty"])?;
    tracing::info!("service status: {status}");

    tracing::info!("deploy complete");
    Ok(())
}

// --- helpers ---

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
