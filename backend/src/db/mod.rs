use rusqlite::{params, Connection, Result as SqlResult};
use std::fs;
use std::path::Path;
use std::sync::Mutex;

use crate::config::AppConfig;
use crate::crypto;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &str, config: &AppConfig) -> SqlResult<Self> {
        if let Some(parent) = Path::new(path).parent() {
            fs::create_dir_all(parent).ok();
        }
        let conn = Connection::open(path)?;
        conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.migrate()?;
        db.seed_admin(&config.admin_email, &config.admin_password, &config.encryption_key);
        Ok(db)
    }

    fn seed_admin(&self, email: &str, password: &str, encryption_key: &str) {
        let conn = self.conn.lock().unwrap();

        // Check if any users exist at all
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap_or(0);

        if count == 0 {
            let hash = crypto::hash_password(password).expect("Failed to hash admin password");
            let id = uuid::Uuid::new_v4().to_string();
            let now = chrono::Utc::now().to_rfc3339();
            let enc_email = crypto::encrypt_field(email, encryption_key)
                .expect("Failed to encrypt admin email");
            let enc_role = crypto::encrypt_field("admin", encryption_key)
                .expect("Failed to encrypt admin role");
            conn.execute(
                "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![id, enc_email, hash, enc_role, now, now],
            )
            .ok();
            log::info!("Admin user seeded: {}", email);
        }
    }

    fn migrate(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'client',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS clients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                document TEXT NOT NULL,
                phonenumber TEXT NOT NULL,
                address TEXT,
                street TEXT NOT NULL,
                neighborhood TEXT NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                cep TEXT NOT NULL,
                segment TEXT NOT NULL,
                responsible_name TEXT NOT NULL,
                responsible_surname TEXT NOT NULL,
                manager_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS dashboards (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                iframe_url TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS usage_data (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                dashboard_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_data TEXT NOT NULL,
                event_time TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS access_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                dashboard_id TEXT NOT NULL,
                duration INTEGER NOT NULL,
                accessed_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
            CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
            ",
        )?;
        Ok(())
    }
}
