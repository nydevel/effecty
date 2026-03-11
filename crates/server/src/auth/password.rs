use crate::error::AppError;

pub fn hash(password: &str) -> Result<String, AppError> {
    db::password::hash(password).map_err(|e| AppError::Internal(e.to_string()))
}

pub fn verify(password: &str, hash: &str) -> Result<bool, AppError> {
    db::password::verify(password, hash).map_err(|e| AppError::Internal(e.to_string()))
}
