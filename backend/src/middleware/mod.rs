use actix_web::{dev::ServiceRequest, Error, HttpMessage};
use actix_web::error::ErrorUnauthorized;

use crate::config::AppConfig;
use crate::crypto;

pub fn extract_claims(req: &ServiceRequest, config: &AppConfig) -> Result<crypto::JwtClaims, Error> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| ErrorUnauthorized("Missing Authorization header"))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| ErrorUnauthorized("Invalid Authorization format"))?;

    crypto::verify_jwt(token, &config.jwt_secret)
        .map_err(|e| ErrorUnauthorized(format!("Invalid token: {}", e)))
}

/// Helper to get claims from request extensions (set by handler after extraction).
pub fn get_claims(req: &actix_web::HttpRequest) -> Option<crypto::JwtClaims> {
    req.extensions().get::<crypto::JwtClaims>().cloned()
}

pub fn require_claims(req: &actix_web::HttpRequest) -> Result<crypto::JwtClaims, actix_web::Error> {
    get_claims(req).ok_or_else(|| ErrorUnauthorized("Not authenticated"))
}

pub fn require_admin(req: &actix_web::HttpRequest) -> Result<crypto::JwtClaims, actix_web::Error> {
    let claims = require_claims(req)?;
    if claims.role != "admin" {
        return Err(actix_web::error::ErrorForbidden("Admin access required"));
    }
    Ok(claims)
}
