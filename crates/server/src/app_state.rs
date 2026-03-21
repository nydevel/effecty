use std::sync::Arc;

use effecty_core::config::Config;
use sqlx::SqlitePool;

use crate::auth::rate_limit::LoginRateLimiter;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub config: Arc<Config>,
    pub login_limiter: LoginRateLimiter,
}
