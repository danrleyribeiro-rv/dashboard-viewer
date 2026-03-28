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

fn row_to_dashboard(row: &rusqlite::Row, key: &str) -> rusqlite::Result<DashboardResponse> {
    Ok(DashboardResponse {
        id: row.get(0)?,
        name: dec(&row.get::<_, String>(1)?, key),
        iframe_url: dec(&row.get::<_, String>(2)?, key),
        user_id: row.get(3)?,
    })
}

pub async fn list_all(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }
    let key = &config.encryption_key;
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, name, iframe_url, user_id FROM dashboards ORDER BY name")
        .unwrap();
    let rows: Vec<DashboardResponse> = stmt
        .query_map([], |row| row_to_dashboard(row, key))
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();
    HttpResponse::Ok().json(rows)
}

pub async fn list_mine(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>) -> HttpResponse {
    let claims = match middleware::require_claims(&req) {
        Ok(c) => c,
        Err(e) => return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() }),
    };
    let key = &config.encryption_key;
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, name, iframe_url, user_id FROM dashboards WHERE user_id = ?1 ORDER BY name")
        .unwrap();
    let rows: Vec<DashboardResponse> = stmt
        .query_map(params![claims.sub], |row| row_to_dashboard(row, key))
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();
    HttpResponse::Ok().json(rows)
}

pub async fn get_by_id(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>, path: web::Path<String>) -> HttpResponse {
    if let Err(e) = middleware::require_claims(&req) {
        return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() });
    }
    let id = path.into_inner();
    let key = &config.encryption_key;
    let conn = db.conn.lock().unwrap();
    match conn.query_row(
        "SELECT id, name, iframe_url, user_id FROM dashboards WHERE id = ?1",
        params![id],
        |row| row_to_dashboard(row, key),
    ) {
        Ok(d) => HttpResponse::Ok().json(d),
        Err(_) => HttpResponse::NotFound().json(ErrorResponse { error: "Dashboard not found".into() }),
    }
}

pub async fn create(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>, body: web::Json<CreateDashboardRequest>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }
    let key = &config.encryption_key;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let enc_name = enc(&body.name, key);
    let enc_url = enc(&body.iframe_url, key);
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO dashboards (id, name, iframe_url, user_id, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6)",
        params![id, enc_name, enc_url, body.user_id, now, now],
    ).ok();
    HttpResponse::Created().json(DashboardResponse {
        id,
        name: body.name.clone(),
        iframe_url: body.iframe_url.clone(),
        user_id: body.user_id.clone(),
    })
}

pub async fn update(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>, path: web::Path<String>, body: web::Json<UpdateDashboardRequest>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }
    let key = &config.encryption_key;
    let id = path.into_inner();
    let now = chrono::Utc::now().to_rfc3339();
    let conn = db.conn.lock().unwrap();

    if let Some(ref name) = body.name {
        let enc_name = enc(name, key);
        conn.execute("UPDATE dashboards SET name=?1, updated_at=?2 WHERE id=?3", params![enc_name, now, id]).ok();
    }
    if let Some(ref url) = body.iframe_url {
        let enc_url = enc(url, key);
        conn.execute("UPDATE dashboards SET iframe_url=?1, updated_at=?2 WHERE id=?3", params![enc_url, now, id]).ok();
    }
    if let Some(ref uid) = body.user_id {
        conn.execute("UPDATE dashboards SET user_id=?1, updated_at=?2 WHERE id=?3", params![uid, now, id]).ok();
    }

    match conn.query_row("SELECT id, name, iframe_url, user_id FROM dashboards WHERE id=?1", params![id], |row| row_to_dashboard(row, key)) {
        Ok(d) => HttpResponse::Ok().json(d),
        Err(_) => HttpResponse::NotFound().json(ErrorResponse { error: "Dashboard not found".into() }),
    }
}

pub async fn remove(req: HttpRequest, db: web::Data<Database>, path: web::Path<String>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }
    let id = path.into_inner();
    let conn = db.conn.lock().unwrap();
    let affected = conn.execute("DELETE FROM dashboards WHERE id=?1", params![id]).unwrap_or(0);
    if affected == 0 {
        HttpResponse::NotFound().json(ErrorResponse { error: "Dashboard not found".into() })
    } else {
        HttpResponse::Ok().json(MessageResponse { message: "Dashboard deleted".into() })
    }
}

pub async fn add_usage_data(req: HttpRequest, db: web::Data<Database>, body: web::Json<UsageDataRequest>) -> HttpResponse {
    let claims = match middleware::require_claims(&req) {
        Ok(c) => c,
        Err(e) => return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() }),
    };
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let event_data = serde_json::to_string(&body.event_data).unwrap_or_default();
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO usage_data (id, user_id, dashboard_id, event_type, event_data, event_time) VALUES (?1,?2,?3,?4,?5,?6)",
        params![id, claims.sub, body.dashboard_id, body.event_type, event_data, now],
    ).ok();
    HttpResponse::Created().json(IdResponse { id })
}

pub async fn list_usage_data(req: HttpRequest, db: web::Data<Database>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, user_id, dashboard_id, event_type, event_data, event_time FROM usage_data ORDER BY event_time DESC")
        .unwrap();
    let rows: Vec<UsageDataResponse> = stmt
        .query_map([], |row| {
            Ok(UsageDataResponse {
                id: row.get(0)?,
                user_id: row.get(1)?,
                dashboard_id: row.get(2)?,
                event_type: row.get(3)?,
                event_data: row.get(4)?,
                event_time: row.get(5)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();
    HttpResponse::Ok().json(rows)
}

pub async fn add_access_log(req: HttpRequest, db: web::Data<Database>, body: web::Json<AccessLogRequest>) -> HttpResponse {
    let claims = match middleware::require_claims(&req) {
        Ok(c) => c,
        Err(e) => return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() }),
    };
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO access_logs (id, user_id, dashboard_id, duration, accessed_at) VALUES (?1,?2,?3,?4,?5)",
        params![id, claims.sub, body.dashboard_id, body.duration, now],
    ).ok();
    HttpResponse::Created().json(IdResponse { id })
}

pub async fn list_access_logs(req: HttpRequest, db: web::Data<Database>) -> HttpResponse {
    if let Err(e) = middleware::require_admin(&req) {
        return HttpResponse::Forbidden().json(ErrorResponse { error: e.to_string() });
    }
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, user_id, dashboard_id, duration, accessed_at FROM access_logs ORDER BY accessed_at DESC")
        .unwrap();
    let rows: Vec<AccessLogResponse> = stmt
        .query_map([], |row| {
            Ok(AccessLogResponse {
                id: row.get(0)?,
                user_id: row.get(1)?,
                dashboard_id: row.get(2)?,
                duration: row.get(3)?,
                accessed_at: row.get(4)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();
    HttpResponse::Ok().json(rows)
}
