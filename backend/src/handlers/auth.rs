use actix_web::{web, HttpRequest, HttpResponse};
use rusqlite::params;

use crate::config::AppConfig;
use crate::crypto;
use crate::db::Database;
use crate::middleware;
use crate::models::*;

fn enc(val: &str, key: &str) -> String {
    crypto::encrypt_field(val, key).unwrap_or_else(|_| val.to_string())
}

fn dec(val: &str, key: &str) -> String {
    crypto::decrypt_field(val, key).unwrap_or_else(|_| val.to_string())
}

pub async fn register(
    req: HttpRequest,
    db: web::Data<Database>,
    config: web::Data<AppConfig>,
    body: web::Json<RegisterRequest>,
) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }

    let role = body.role.clone().unwrap_or_else(|| "client".into());
    if body.email.is_empty() || body.password.len() < 8 {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Email is required and password must be at least 8 characters".into(),
        });
    }

    let key = &config.encryption_key;
    let conn = db.conn.lock().unwrap();

    // Check existing: need to scan all emails and decrypt to compare
    let mut stmt = conn.prepare("SELECT email FROM users WHERE deleted_at IS NULL").unwrap();
    let exists = stmt.query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .any(|stored_enc| dec(&stored_enc, key) == body.email);

    if exists {
        return HttpResponse::Conflict().json(ErrorResponse { error: "User already exists".into() });
    }

    let password_hash = match crypto::hash_password(&body.password) {
        Ok(h) => h,
        Err(e) => return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("Hash error: {}", e) }),
    };

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let enc_email = enc(&body.email, key);
    let enc_role = enc(&role, key);

    if let Err(e) = conn.execute(
        "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, enc_email, password_hash, enc_role, now, now],
    ) {
        return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("DB error: {}", e) });
    }

    let token = match crypto::generate_jwt(&id, &body.email, &role, &config.jwt_secret, config.jwt_expires_in_secs) {
        Ok(t) => t,
        Err(e) => return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("JWT error: {}", e) }),
    };

    HttpResponse::Created().json(AuthResponse {
        token,
        user: UserResponse { id, email: body.email.clone(), role },
    })
}

pub async fn login(
    db: web::Data<Database>,
    config: web::Data<AppConfig>,
    body: web::Json<LoginRequest>,
) -> HttpResponse {
    let key = &config.encryption_key;
    let conn = db.conn.lock().unwrap();

    // Scan users, decrypt email to find match
    let mut stmt = conn.prepare("SELECT id, email, password_hash, role FROM users WHERE deleted_at IS NULL").unwrap();
    let found = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
        ))
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .find(|(_, enc_email, _, _)| dec(enc_email, key) == body.email);

    let (id, _, password_hash, enc_role) = match found {
        Some(r) => r,
        None => return HttpResponse::Unauthorized().json(ErrorResponse { error: "Invalid credentials".into() }),
    };

    let role = dec(&enc_role, key);

    match crypto::verify_password(&body.password, &password_hash) {
        Ok(true) => {}
        _ => return HttpResponse::Unauthorized().json(ErrorResponse { error: "Invalid credentials".into() }),
    }

    let token = match crypto::generate_jwt(&id, &body.email, &role, &config.jwt_secret, config.jwt_expires_in_secs) {
        Ok(t) => t,
        Err(e) => return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("JWT error: {}", e) }),
    };

    HttpResponse::Ok().json(AuthResponse {
        token,
        user: UserResponse { id, email: body.email.clone(), role },
    })
}

pub async fn me(req: HttpRequest) -> HttpResponse {
    match middleware::require_claims(&req) {
        Ok(claims) => HttpResponse::Ok().json(UserResponse {
            id: claims.sub,
            email: claims.email,
            role: claims.role,
        }),
        Err(e) => HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() }),
    }
}

pub async fn change_password(
    req: HttpRequest,
    db: web::Data<Database>,
    body: web::Json<ChangePasswordRequest>,
) -> HttpResponse {
    let claims = match middleware::require_claims(&req) {
        Ok(c) => c,
        Err(e) => return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() }),
    };

    if body.new_password.len() < 8 {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "New password must be at least 8 characters".into(),
        });
    }

    let conn = db.conn.lock().unwrap();

    let current_hash: String = match conn.query_row(
        "SELECT password_hash FROM users WHERE id = ?1 AND deleted_at IS NULL",
        params![claims.sub],
        |row| row.get(0),
    ) {
        Ok(h) => h,
        Err(_) => return HttpResponse::NotFound().json(ErrorResponse { error: "User not found".into() }),
    };

    match crypto::verify_password(&body.current_password, &current_hash) {
        Ok(true) => {}
        _ => return HttpResponse::Unauthorized().json(ErrorResponse { error: "Current password is incorrect".into() }),
    }

    let new_hash = match crypto::hash_password(&body.new_password) {
        Ok(h) => h,
        Err(e) => return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("Hash error: {}", e) }),
    };

    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE users SET password_hash = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_hash, now, claims.sub],
    ).ok();

    HttpResponse::Ok().json(MessageResponse { message: "Password updated".into() })
}
