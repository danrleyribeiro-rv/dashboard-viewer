use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub port: u16,
    pub database_path: String,
    pub encryption_key: String,
    pub jwt_secret: String,
    pub jwt_expires_in_secs: u64,
    pub cors_origin: String,
    pub admin_email: String,
    pub admin_password: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let expires_str = env::var("JWT_EXPIRES_IN").unwrap_or_else(|_| "24h".into());
        let jwt_expires_in_secs = parse_duration(&expires_str);

        Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "3001".into())
                .parse()
                .expect("PORT must be a number"),
            database_path: env::var("DATABASE_PATH")
                .unwrap_or_else(|_| "./data/database.sqlite".into()),
            encryption_key: env::var("ENCRYPTION_KEY")
                .expect("ENCRYPTION_KEY is required"),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET is required"),
            jwt_expires_in_secs,
            cors_origin: env::var("CORS_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:5173".into()),
            admin_email: env::var("ADMIN_EMAIL")
                .unwrap_or_else(|_| "admin@admin.com".into()),
            admin_password: env::var("ADMIN_PASSWORD")
                .unwrap_or_else(|_| "Admin@123".into()),
        }
    }
}

fn parse_duration(s: &str) -> u64 {
    let s = s.trim();
    if let Some(h) = s.strip_suffix('h') {
        h.parse::<u64>().unwrap_or(24) * 3600
    } else if let Some(d) = s.strip_suffix('d') {
        d.parse::<u64>().unwrap_or(1) * 86400
    } else if let Some(m) = s.strip_suffix('m') {
        m.parse::<u64>().unwrap_or(60) * 60
    } else {
        s.parse::<u64>().unwrap_or(86400)
    }
}
