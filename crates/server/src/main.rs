#![deny(unsafe_code)]

mod app_state;
mod auth;
mod error;
mod routes;

use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::Result;
use effecty_core::config::Config;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use crate::app_state::AppState;

struct Args {
    config_path: PathBuf,
}

fn parse_args() -> Args {
    let args: Vec<String> = std::env::args().collect();
    let mut config_path = PathBuf::from("configuration.toml");
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
            _ => {}
        }
        i += 1;
    }

    Args { config_path }
}

fn print_usage() {
    eprintln!("effecty — personal productivity platform");
    eprintln!();
    eprintln!("Usage: effecty [--config <path>]");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  -c, --config <path>  Path to configuration file (default: configuration.toml)");
    eprintln!("  -h, --help           Show this help message");
    eprintln!();
    eprintln!("Migrations run automatically on start.");
    eprintln!("Use effecty-cli for user management and deployment.");
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
    serve(&args.config_path).await
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
