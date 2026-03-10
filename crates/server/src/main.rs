mod routes;

use std::path::Path;

use anyhow::Result;
use base::config::Config;
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let config = Config::load(Path::new("configuration.toml"))?;
    let addr = config.server.addr();

    let app = routes::create_router().layer(TraceLayer::new_for_http());

    tracing::info!("server v{} listening on {}", base::version(), addr);

    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
