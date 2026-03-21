#![warn(unsafe_code)]

mod app_state;
mod auth;
mod error;
mod routes;

use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{bail, Result};
use effecty_core::config::Config;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use crate::app_state::AppState;

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
        command,
        extra,
    }
}

fn print_usage() {
    eprintln!("effecty — personal productivity platform");
    eprintln!();
    eprintln!("Usage: effecty [--config <path>] [command] [args]");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  -c, --config <path>  Path to configuration file (default: configuration.toml)");
    eprintln!("  -h, --help           Show this help message");
    eprintln!();
    eprintln!("Commands:");
    eprintln!("  (none)                     Start the web server (default)");
    eprintln!("  serve                      Start the web server");
    eprintln!("  create-user <email>        Create a new user (prompts for password)");
    eprintln!();
    eprintln!("Migrations run automatically on server start.");
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn,tower_http=debug")),
        )
        .init();

    let args = parse_args();

    match args.command.as_deref() {
        None | Some("serve") => serve(&args.config_path).await,
        Some("create-user") => create_user(&args.config_path, &args.extra).await,
        Some(cmd) => bail!("unknown command: {cmd}\nRun 'effecty --help' for usage"),
    }
}

async fn serve(config_path: &Path) -> Result<()> {
    let config = Config::load(config_path)?;
    let addr = config.server.addr();

    tracing::info!(
        environment = %config.app.environment,
        version = effecty_core::version(),
        "starting effecty server",
    );

    tracing::info!(url = %config.database.url_masked(), "connecting to database");
    db::run_migrations(&config.database.url).await?;
    let pool = db::create_pool(&config.database).await?;

    tokio::fs::create_dir_all(&config.storage.upload_dir).await?;

    let login_limiter = auth::rate_limit::LoginRateLimiter::new();

    // Periodic cleanup of stale rate-limit entries
    let limiter_cleanup = login_limiter.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(600));
        #[allow(unused_labels)]
        'cleanup: loop {
            interval.tick().await;
            limiter_cleanup.cleanup().await;
        }
    });

    let state = AppState {
        pool,
        config: Arc::new(config),
        login_limiter,
    };

    let app = routes::create_router(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let app = setup_swagger(app);

    tracing::info!(addr = %addr, "listening");

    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn create_user(config_path: &Path, extra: &[String]) -> Result<()> {
    let email = extra.first().ok_or_else(|| {
        anyhow::anyhow!(
            "Usage: effecty create-user <email>\nExample: effecty create-user admin@effecty.org"
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

    let existing = db::repo::users::find_by_email(&pool, email).await?;
    if existing.is_some() {
        bail!("user with email {email} already exists");
    }

    let hash = db::password::hash(&password)?;
    let user = db::repo::users::create(&pool, email, &hash).await?;

    tracing::info!(email, id = %user.id, "user created");
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

#[cfg(feature = "openapi")]
fn setup_swagger(app: axum::Router) -> axum::Router {
    use utoipa::OpenApi;
    use utoipa_swagger_ui::SwaggerUi;

    #[derive(OpenApi)]
    #[openapi(
        info(title = "effecty API", version = "0.1.0"),
        paths(),
        components(schemas())
    )]
    struct ApiDoc;

    tracing::info!("swagger UI enabled at /swagger-ui");
    app.merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
}

#[cfg(not(feature = "openapi"))]
fn setup_swagger(app: axum::Router) -> axum::Router {
    app
}
