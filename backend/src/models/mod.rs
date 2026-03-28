use serde::{Deserialize, Serialize};

// ===== Request bodies =====

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccountRequest {
    pub email: String,
    pub password: String,
    pub role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccountRequest {
    pub email: Option<String>,
    pub password: Option<String>,
    pub role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateClientRequest {
    pub name: String,
    pub email: String,
    pub document: String,
    pub phonenumber: String,
    pub address: Option<String>,
    pub street: String,
    pub neighborhood: String,
    pub city: String,
    pub state: String,
    pub cep: String,
    pub segment: String,
    pub responsible_name: String,
    pub responsible_surname: String,
    pub manager_id: String,
    pub user_id: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateClientRequest {
    pub name: Option<String>,
    pub email: Option<String>,
    pub document: Option<String>,
    pub phonenumber: Option<String>,
    pub address: Option<String>,
    pub street: Option<String>,
    pub neighborhood: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub cep: Option<String>,
    pub segment: Option<String>,
    pub responsible_name: Option<String>,
    pub responsible_surname: Option<String>,
    pub manager_id: Option<String>,
    pub user_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDashboardRequest {
    pub name: String,
    pub iframe_url: String,
    pub user_id: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDashboardRequest {
    pub name: Option<String>,
    pub iframe_url: Option<String>,
    pub user_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UsageDataRequest {
    pub dashboard_id: String,
    pub event_type: String,
    pub event_data: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct AccessLogRequest {
    pub dashboard_id: String,
    pub duration: i64,
}

// ===== Response bodies =====

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub role: String,
}

#[derive(Debug, Serialize)]
pub struct AccountResponse {
    pub id: String,
    pub email: String,
    pub role: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct ClientResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub document: String,
    pub phonenumber: String,
    pub address: Option<String>,
    pub street: String,
    pub neighborhood: String,
    pub city: String,
    pub state: String,
    pub cep: String,
    pub segment: String,
    pub responsible_name: String,
    pub responsible_surname: String,
    pub manager_id: String,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct DashboardResponse {
    pub id: String,
    pub name: String,
    pub iframe_url: String,
    pub user_id: String,
}

#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Serialize)]
pub struct IdResponse {
    pub id: String,
}

#[derive(Debug, Serialize)]
pub struct UsageDataResponse {
    pub id: String,
    pub user_id: String,
    pub dashboard_id: String,
    pub event_type: String,
    pub event_data: String,
    pub event_time: String,
}

#[derive(Debug, Serialize)]
pub struct AccessLogResponse {
    pub id: String,
    pub user_id: String,
    pub dashboard_id: String,
    pub duration: i64,
    pub accessed_at: String,
}
