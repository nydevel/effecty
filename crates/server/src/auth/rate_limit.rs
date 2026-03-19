use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::sync::Mutex;

const MAX_ATTEMPTS: u32 = 7;
const WINDOW: Duration = Duration::from_secs(300); // 5 minutes

#[derive(Clone)]
pub struct LoginRateLimiter {
    attempts: Arc<Mutex<HashMap<IpAddr, Vec<Instant>>>>,
}

impl LoginRateLimiter {
    pub fn new() -> Self {
        Self {
            attempts: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Returns `true` if the request is allowed, `false` if rate-limited.
    pub async fn check(&self, ip: IpAddr) -> bool {
        let mut map = self.attempts.lock().await;
        let now = Instant::now();

        let entries = map.entry(ip).or_default();
        entries.retain(|t| now.duration_since(*t) < WINDOW);

        if entries.len() >= MAX_ATTEMPTS as usize {
            return false;
        }

        entries.push(now);
        true
    }

    /// Remove stale entries to prevent memory growth.
    pub async fn cleanup(&self) {
        let mut map = self.attempts.lock().await;
        let now = Instant::now();
        map.retain(|_, entries| {
            entries.retain(|t| now.duration_since(*t) < WINDOW);
            !entries.is_empty()
        });
    }
}
