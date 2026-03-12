#![deny(unsafe_code)]

mod app_state;
mod auth;
mod error;
mod routes;

use std::path::Path;
use std::sync::Arc;

use anyhow::Result;
use effecty_core::config::Config;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use crate::app_state::AppState;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn,tower_http=debug")),
        )
        .init();

    let config = Config::load(Path::new("configuration.toml"))?;
    let addr = config.server.addr();

    tracing::info!(
        environment = %config.app.environment,
        version = effecty_core::version(),
        "starting effecty server",
    );

    tracing::info!(url = %config.database.url_masked(), "connecting to database");
    db::run_migrations(&config.database.url).await?;
    let pool = db::create_pool(&config.database).await?;

    let state = AppState {
        pool,
        config: Arc::new(config),
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
