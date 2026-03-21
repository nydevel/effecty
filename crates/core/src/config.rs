use std::fmt;
use std::path::Path;

use anyhow::{Context, Result};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub app: AppConfig,
    #[serde(default)]
    pub storage: StorageConfig,
}

#[derive(Debug, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Deserialize)]
pub struct AuthConfig {
    pub registration_enabled: bool,
    pub jwt_secret: String,
    pub jwt_expiration_hours: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Environment {
    Dev,
    Prod,
    Test,
}

impl fmt::Display for Environment {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Dev => write!(f, "dev"),
            Self::Prod => write!(f, "prod"),
            Self::Test => write!(f, "test"),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub environment: Environment,
}

impl AppConfig {
    pub fn is_dev(&self) -> bool {
        self.environment == Environment::Dev
    }
}

#[derive(Debug, Deserialize)]
pub struct StorageConfig {
    #[serde(default = "StorageConfig::default_upload_dir")]
    pub upload_dir: String,
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            upload_dir: Self::default_upload_dir(),
        }
    }
}

impl StorageConfig {
    fn default_upload_dir() -> String {
        "uploads".into()
    }
}

impl Config {
    pub fn load(path: &Path) -> Result<Self> {
        let content = std::fs::read_to_string(path).context("failed to read configuration file")?;
        let config: Config = toml::from_str(&content).context("failed to parse configuration")?;
        Ok(config)
    }
}

impl ServerConfig {
    pub fn addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

impl DatabaseConfig {
    /// Returns the database URL with the password masked for safe logging.
    pub fn url_masked(&self) -> String {
        if self.url.starts_with("sqlite://") {
            return self.url.clone();
        }
        if let Some(at_pos) = self.url.find('@') {
            if let Some(colon_pos) = self.url[..at_pos].rfind(':') {
                let scheme_end = self.url.find("://").map_or(0, |p| p + 3);
                if colon_pos > scheme_end {
                    return format!("{}:***{}", &self.url[..colon_pos], &self.url[at_pos..]);
                }
            }
        }
        self.url.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_full_config() {
        let toml_str = r#"
[server]
host = "127.0.0.1"
port = 3000

[database]
url = "sqlite://data/effecty.db?mode=rwc"
max_connections = 10

[auth]
registration_enabled = false
jwt_secret = "test-secret"
jwt_expiration_hours = 24

[app]
environment = "dev"
"#;
        let config: Config = toml::from_str(toml_str).unwrap();
        assert_eq!(config.server.host, "127.0.0.1");
        assert_eq!(config.server.port, 3000);
        assert_eq!(config.server.addr(), "127.0.0.1:3000");
        assert_eq!(config.database.max_connections, 10);
        assert!(!config.auth.registration_enabled);
        assert_eq!(config.auth.jwt_expiration_hours, 24);
        assert!(config.app.is_dev());
        assert_eq!(config.app.environment, Environment::Dev);
    }
}
