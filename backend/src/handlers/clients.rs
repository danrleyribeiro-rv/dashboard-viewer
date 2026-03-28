use actix_web::{web, HttpRequest, HttpResponse};
use rusqlite::params;

use crate::config::AppConfig;
use crate::crypto;
use crate::db::Database;
use crate::middleware;
use crate::models::*;

fn encrypt_str(val: &str, key: &str) -> String {
    crypto::encrypt_field(val, key).unwrap_or_else(|_| val.to_string())
}

fn decrypt_str(val: &str, key: &str) -> String {
    crypto::decrypt_field(val, key).unwrap_or_else(|_| val.to_string())
}

fn row_to_client(row: &rusqlite::Row, key: &str) -> rusqlite::Result<ClientResponse> {
    Ok(ClientResponse {
        id: row.get(0)?,
        name: row.get(1)?,
        email: row.get(2)?,
        document: decrypt_str(&row.get::<_, String>(3)?, key),
        phonenumber: decrypt_str(&row.get::<_, String>(4)?, key),
        address: row.get(5)?,
        street: row.get(6)?,
        neighborhood: row.get(7)?,
        city: row.get(8)?,
        state: row.get(9)?,
        cep: decrypt_str(&row.get::<_, String>(10)?, key),
        segment: row.get(11)?,
        responsible_name: row.get(12)?,
        responsible_surname: row.get(13)?,
        manager_id: row.get(14)?,
        user_id: row.get(15)?,
        created_at: row.get(16)?,
        updated_at: row.get(17)?,
    })
}

const SELECT_COLS: &str = "id, name, email, document, phonenumber, address, street, neighborhood, city, state, cep, segment, responsible_name, responsible_surname, manager_id, user_id, created_at, updated_at";

pub async fn list(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>) -> HttpResponse {
    if let Err(e) = middleware::require_claims(&req) {
        return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() });
    }
    let conn = db.conn.lock().unwrap();
    let sql = format!("SELECT {} FROM clients WHERE deleted_at IS NULL", SELECT_COLS);
    let mut stmt = conn.prepare(&sql).unwrap();
    let key = &config.encryption_key;
    let rows: Vec<ClientResponse> = stmt
        .query_map([], |row| row_to_client(row, key))
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
    let conn = db.conn.lock().unwrap();
    let sql = format!("SELECT {} FROM clients WHERE id = ?1 AND deleted_at IS NULL", SELECT_COLS);
    match conn.query_row(&sql, params![id], |row| row_to_client(row, &config.encryption_key)) {
        Ok(c) => HttpResponse::Ok().json(c),
        Err(_) => HttpResponse::NotFound().json(ErrorResponse { error: "Client not found".into() }),
    }
}

pub async fn create(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>, body: web::Json<CreateClientRequest>) -> HttpResponse {
    if let Err(e) = middleware::require_claims(&req) {
        return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() });
    }
    let key = &config.encryption_key;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let enc_doc = encrypt_str(&body.document, key);
    let enc_phone = encrypt_str(&body.phonenumber, key);
    let enc_cep = encrypt_str(&body.cep, key);

    let conn = db.conn.lock().unwrap();
    match conn.execute(
        "INSERT INTO clients (id, name, email, document, phonenumber, address, street, neighborhood, city, state, cep, segment, responsible_name, responsible_surname, manager_id, user_id, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
        params![id, body.name, body.email, enc_doc, enc_phone, body.address, body.street, body.neighborhood, body.city, body.state, enc_cep, body.segment, body.responsible_name, body.responsible_surname, body.manager_id, body.user_id, now, now],
    ) {
        Ok(_) => {
            let sql = format!("SELECT {} FROM clients WHERE id = ?1", SELECT_COLS);
            match conn.query_row(&sql, params![id], |row| row_to_client(row, key)) {
                Ok(c) => HttpResponse::Created().json(c),
                Err(e) => HttpResponse::InternalServerError().json(ErrorResponse { error: e.to_string() }),
            }
        }
        Err(e) => HttpResponse::InternalServerError().json(ErrorResponse { error: e.to_string() }),
    }
}

pub async fn update(req: HttpRequest, db: web::Data<Database>, config: web::Data<AppConfig>, path: web::Path<String>, body: web::Json<UpdateClientRequest>) -> HttpResponse {
    if let Err(e) = middleware::require_claims(&req) {
        return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() });
    }
    let id = path.into_inner();
    let key = &config.encryption_key;
    let now = chrono::Utc::now().to_rfc3339();
    let conn = db.conn.lock().unwrap();

    let exists: bool = conn.query_row("SELECT COUNT(*)>0 FROM clients WHERE id=?1 AND deleted_at IS NULL", params![id], |r| r.get(0)).unwrap_or(false);
    if !exists {
        return HttpResponse::NotFound().json(ErrorResponse { error: "Client not found".into() });
    }

    let mut sets = vec!["updated_at = ?1".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(now.clone())];
    let mut idx = 2u32;

    macro_rules! set_field {
        ($field:ident) => {
            if let Some(ref v) = body.$field {
                sets.push(format!("{} = ?{}", stringify!($field), idx));
                values.push(Box::new(v.clone()));
                idx += 1;
            }
        };
    }
    macro_rules! set_encrypted {
        ($field:ident) => {
            if let Some(ref v) = body.$field {
                sets.push(format!("{} = ?{}", stringify!($field), idx));
                values.push(Box::new(encrypt_str(v, key)));
                idx += 1;
            }
        };
    }

    set_field!(name);
    set_field!(email);
    set_encrypted!(document);
    set_encrypted!(phonenumber);
    set_field!(address);
    set_field!(street);
    set_field!(neighborhood);
    set_field!(city);
    set_field!(state);
    set_encrypted!(cep);
    set_field!(segment);
    set_field!(responsible_name);
    set_field!(responsible_surname);
    set_field!(manager_id);
    set_field!(user_id);

    let sql = format!("UPDATE clients SET {} WHERE id = ?{}", sets.join(", "), idx);
    values.push(Box::new(id.clone()));

    let params_ref: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|b| b.as_ref()).collect();
    conn.execute(&sql, params_ref.as_slice()).ok();

    let select_sql = format!("SELECT {} FROM clients WHERE id = ?1", SELECT_COLS);
    match conn.query_row(&select_sql, params![id], |row| row_to_client(row, key)) {
        Ok(c) => HttpResponse::Ok().json(c),
        Err(e) => HttpResponse::InternalServerError().json(ErrorResponse { error: e.to_string() }),
    }
}

pub async fn remove(req: HttpRequest, db: web::Data<Database>, path: web::Path<String>) -> HttpResponse {
    if let Err(e) = middleware::require_claims(&req) {
        return HttpResponse::Unauthorized().json(ErrorResponse { error: e.to_string() });
    }
    let id = path.into_inner();
    let now = chrono::Utc::now().to_rfc3339();
    let conn = db.conn.lock().unwrap();
    let affected = conn.execute("UPDATE clients SET deleted_at=?1, updated_at=?1 WHERE id=?2 AND deleted_at IS NULL", params![now, id]).unwrap_or(0);
    if affected == 0 {
        HttpResponse::NotFound().json(ErrorResponse { error: "Client not found".into() })
    } else {
        HttpResponse::Ok().json(MessageResponse { message: "Client deleted".into() })
    }
}
