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

pub async fn list(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }

    let key = &config.encryption_key;
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, email, role, created_at, updated_at FROM users WHERE deleted_at IS NULL")
        .unwrap();
    let rows: Vec<AccountResponse> = stmt
        .query_map([], |row| {
            let enc_email: String = row.get(1)?;
            let enc_role: String = row.get(2)?;
            Ok((row.get::<_, String>(0)?, enc_email, enc_role, row.get::<_, String>(3)?, row.get::<_, String>(4)?))
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .map(|(id, enc_email, enc_role, ca, ua)| AccountResponse {
            id,
            email: dec(&enc_email, key),
            role: dec(&enc_role, key),
            created_at: ca,
            updated_at: ua,
        })
        .collect();

    HttpResponse::Ok().json(rows)
}

pub async fn get_by_id(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>, path: web::Path<String>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }

    let id = path.into_inner();
    let key = &config.encryption_key;
    let conn = db.conn.lock().unwrap();

    match conn.query_row(
        "SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?1 AND deleted_at IS NULL",
        params![id],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        },
    ) {
        Ok((id, enc_email, enc_role, ca, ua)) => HttpResponse::Ok().json(AccountResponse {
            id,
            email: dec(&enc_email, key),
            role: dec(&enc_role, key),
            created_at: ca,
            updated_at: ua,
        }),
        Err(_) => HttpResponse::NotFound().json(ErrorResponse { error: "Account not found".into() }),
    }
}

pub async fn create(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>, body: web::Json<CreateAccountRequest>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }

    let key = &config.encryption_key;
    let role = body.role.clone().unwrap_or_else(|| "client".into());

    // Check duplicate by scanning
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn.prepare("SELECT email FROM users WHERE deleted_at IS NULL").unwrap();
    let exists = stmt.query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .any(|stored| dec(&stored, key) == body.email);
    if exists {
        return HttpResponse::Conflict().json(ErrorResponse { error: "Account already exists".into() });
    }

    let password_hash = match crypto::hash_password(&body.password) {
        Ok(h) => h,
        Err(e) => return HttpResponse::InternalServerError().json(ErrorResponse { error: e }),
    };

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let enc_email = enc(&body.email, key);
    let enc_role = enc(&role, key);

    match conn.execute(
        "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, enc_email, password_hash, enc_role, now, now],
    ) {
        Ok(_) => HttpResponse::Created().json(AccountResponse {
            id,
            email: body.email.clone(),
            role,
            created_at: now.clone(),
            updated_at: now,
        }),
        Err(e) => HttpResponse::InternalServerError().json(ErrorResponse { error: e.to_string() }),
    }
}

pub async fn update(
    req: HttpRequest,
    db: web::Data<Database>,
    config: web::Data<AppConfig>,
    path: web::Path<String>,
    body: web::Json<UpdateAccountRequest>,
) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }

    let id = path.into_inner();
    let key = &config.encryption_key;
    let conn = db.conn.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    let exists: bool = conn
        .query_row("SELECT COUNT(*) > 0 FROM users WHERE id = ?1 AND deleted_at IS NULL", params![id], |r| r.get(0))
        .unwrap_or(false);
    if !exists {
        return HttpResponse::NotFound().json(ErrorResponse { error: "Account not found".into() });
    }

    if let Some(ref email) = body.email {
        let enc_email = enc(email, key);
        conn.execute("UPDATE users SET email = ?1, updated_at = ?2 WHERE id = ?3", params![enc_email, now, id]).ok();
    }
    if let Some(ref password) = body.password {
        if let Ok(hash) = crypto::hash_password(password) {
            conn.execute("UPDATE users SET password_hash = ?1, updated_at = ?2 WHERE id = ?3", params![hash, now, id]).ok();
        }
    }
    if let Some(ref role) = body.role {
        let enc_role = enc(role, key);
        conn.execute("UPDATE users SET role = ?1, updated_at = ?2 WHERE id = ?3", params![enc_role, now, id]).ok();
    }

    match conn.query_row(
        "SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?1",
        params![id],
        |row| Ok((row.get::<_,String>(0)?, row.get::<_,String>(1)?, row.get::<_,String>(2)?, row.get::<_,String>(3)?, row.get::<_,String>(4)?)),
    ) {
        Ok((id, enc_email, enc_role, ca, ua)) => HttpResponse::Ok().json(AccountResponse {
            id, email: dec(&enc_email, key), role: dec(&enc_role, key), created_at: ca, updated_at: ua,
        }),
        Err(_) => HttpResponse::InternalServerError().json(ErrorResponse { error: "Update failed".into() }),
    }
}

pub async fn remove(req: HttpRequest, db: web::Data<Database>, path: web::Path<String>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }

    let id = path.into_inner();
    let now = chrono::Utc::now().to_rfc3339();
    let conn = db.conn.lock().unwrap();

    let affected = conn
        .execute("UPDATE users SET deleted_at = ?1, updated_at = ?1 WHERE id = ?2 AND deleted_at IS NULL", params![now, id])
        .unwrap_or(0);

    if affected == 0 {
        HttpResponse::NotFound().json(ErrorResponse { error: "Account not found".into() })
    } else {
        HttpResponse::Ok().json(MessageResponse { message: "Account deleted".into() })
    }
}
