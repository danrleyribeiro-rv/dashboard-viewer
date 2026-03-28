mod config;
mod crypto;
mod db;
mod handlers;
mod middleware;
mod models;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer, HttpResponse, HttpMessage};
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::middleware::from_fn;

use config::AppConfig;
use db::Database;

async fn auth_middleware(
    req: ServiceRequest,
    next: actix_web::middleware::Next<impl actix_web::body::MessageBody>,
) -> Result<ServiceResponse<impl actix_web::body::MessageBody>, actix_web::Error> {
    let path = req.path().to_string();
    let skip = path == "/health"
        || path == "/api/v1/auth/login";

    if !skip {
        if let Some(config) = req.app_data::<web::Data<AppConfig>>() {
            if let Ok(claims) = middleware::extract_claims(&req, config) {
                req.extensions_mut().insert(claims);
            }
        }
    }

    next.call(req).await
}

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let config = AppConfig::from_env();
    let db = Database::new(&config.database_path, &config)
        .expect("Failed to initialize database");

    log::info!("Database initialized at {}", config.database_path);

    let port = config.port;
    let cors_origin = config.cors_origin.clone();

    let db_data = web::Data::new(db);
    let config_data = web::Data::new(config);

    log::info!("Starting server on http://localhost:{}", port);
    log::info!("CORS origin: {}", cors_origin);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin(&cors_origin)
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec!["Content-Type", "Authorization"])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(from_fn(auth_middleware))
            .app_data(db_data.clone())
            .app_data(config_data.clone())
            .app_data(web::JsonConfig::default().limit(10 * 1024 * 1024))
            // Health
            .route("/health", web::get().to(health))
            // Auth
            .route("/api/v1/auth/register", web::post().to(handlers::auth::register))
            .route("/api/v1/auth/login", web::post().to(handlers::auth::login))
            .route("/api/v1/auth/me", web::get().to(handlers::auth::me))
            .route("/api/v1/auth/change-password", web::post().to(handlers::auth::change_password))
            // Accounts (admin)
            .route("/api/v1/accounts", web::get().to(handlers::accounts::list))
            .route("/api/v1/accounts/{id}", web::get().to(handlers::accounts::get_by_id))
            .route("/api/v1/accounts", web::post().to(handlers::accounts::create))
            .route("/api/v1/accounts/{id}", web::put().to(handlers::accounts::update))
            .route("/api/v1/accounts/{id}", web::delete().to(handlers::accounts::remove))
            // Clients
            .route("/api/v1/clients", web::get().to(handlers::clients::list))
            .route("/api/v1/clients/{id}", web::get().to(handlers::clients::get_by_id))
            .route("/api/v1/clients", web::post().to(handlers::clients::create))
            .route("/api/v1/clients/{id}", web::put().to(handlers::clients::update))
            .route("/api/v1/clients/{id}", web::delete().to(handlers::clients::remove))
            // Dashboards
            .route("/api/v1/dashboards", web::get().to(handlers::dashboards::list_all))
            .route("/api/v1/dashboards/mine", web::get().to(handlers::dashboards::list_mine))
            .route("/api/v1/dashboards/usage", web::post().to(handlers::dashboards::add_usage_data))
            .route("/api/v1/dashboards/usage", web::get().to(handlers::dashboards::list_usage_data))
            .route("/api/v1/dashboards/access-log", web::post().to(handlers::dashboards::add_access_log))
            .route("/api/v1/dashboards/access-log", web::get().to(handlers::dashboards::list_access_logs))
            .route("/api/v1/dashboards/{id}", web::get().to(handlers::dashboards::get_by_id))
            .route("/api/v1/dashboards", web::post().to(handlers::dashboards::create))
            .route("/api/v1/dashboards/{id}", web::put().to(handlers::dashboards::update))
            .route("/api/v1/dashboards/{id}", web::delete().to(handlers::dashboards::remove))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
