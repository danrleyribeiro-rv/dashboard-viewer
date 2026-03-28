use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use hmac::{Hmac, Mac};
use rand::RngCore;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

// ===== Password Hashing (Argon2id) =====

pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Hash error: {}", e))?;
    Ok(hash.to_string())
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, String> {
    let parsed = PasswordHash::new(hash).map_err(|e| format!("Parse error: {}", e))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok())
}

// ===== Field Encryption (AES-256-GCM) =====

pub fn encrypt_field(plaintext: &str, key_b64: &str) -> Result<String, String> {
    let key = BASE64.decode(key_b64).map_err(|e| format!("Key decode: {}", e))?;
    if key.len() != 32 {
        return Err("Key must be 32 bytes".into());
    }
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| format!("Cipher: {}", e))?;
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encrypt: {}", e))?;
    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);
    Ok(BASE64.encode(&combined))
}

pub fn decrypt_field(ciphertext_b64: &str, key_b64: &str) -> Result<String, String> {
    let key = BASE64.decode(key_b64).map_err(|e| format!("Key decode: {}", e))?;
    if key.len() != 32 {
        return Err("Key must be 32 bytes".into());
    }
    let combined = BASE64
        .decode(ciphertext_b64)
        .map_err(|e| format!("Ciphertext decode: {}", e))?;
    if combined.len() < 12 {
        return Err("Ciphertext too short".into());
    }
    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| format!("Cipher: {}", e))?;
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decrypt: {}", e))?;
    String::from_utf8(plaintext).map_err(|e| format!("UTF-8: {}", e))
}

// ===== JWT via HMAC-SHA256 =====

pub fn sign_hmac(payload: &str, secret: &str) -> Result<String, String> {
    let mut mac =
        <HmacSha256 as Mac>::new_from_slice(secret.as_bytes()).map_err(|e| format!("HMAC: {}", e))?;
    mac.update(payload.as_bytes());
    Ok(BASE64.encode(mac.finalize().into_bytes()))
}

pub fn verify_hmac(payload: &str, signature_b64: &str, secret: &str) -> Result<bool, String> {
    let mut mac =
        <HmacSha256 as Mac>::new_from_slice(secret.as_bytes()).map_err(|e| format!("HMAC: {}", e))?;
    mac.update(payload.as_bytes());
    let sig = BASE64
        .decode(signature_b64)
        .map_err(|e| format!("Sig decode: {}", e))?;
    Ok(mac.verify_slice(&sig).is_ok())
}

// ===== JWT Token =====

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JwtClaims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub iat: u64,
    pub exp: u64,
}

fn base64url_encode(data: &[u8]) -> String {
    BASE64
        .encode(data)
        .replace('+', "-")
        .replace('/', "_")
        .trim_end_matches('=')
        .to_string()
}

fn base64url_decode(s: &str) -> Result<Vec<u8>, String> {
    let mut b64 = s.replace('-', "+").replace('_', "/");
    while b64.len() % 4 != 0 {
        b64.push('=');
    }
    BASE64.decode(&b64).map_err(|e| format!("b64url decode: {}", e))
}

pub fn generate_jwt(sub: &str, email: &str, role: &str, secret: &str, expires_in: u64) -> Result<String, String> {
    let now = chrono::Utc::now().timestamp() as u64;
    let header = base64url_encode(br#"{"alg":"HS256","typ":"JWT"}"#);
    let claims = JwtClaims {
        sub: sub.into(),
        email: email.into(),
        role: role.into(),
        iat: now,
        exp: now + expires_in,
    };
    let claims_json = serde_json::to_vec(&claims).map_err(|e| format!("JSON: {}", e))?;
    let payload = base64url_encode(&claims_json);
    let signing_input = format!("{}.{}", header, payload);
    let sig = sign_hmac(&signing_input, secret)?;
    let sig_url = sig
        .replace('+', "-")
        .replace('/', "_")
        .trim_end_matches('=')
        .to_string();
    Ok(format!("{}.{}", signing_input, sig_url))
}

pub fn verify_jwt(token: &str, secret: &str) -> Result<JwtClaims, String> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err("Invalid token format".into());
    }
    let signing_input = format!("{}.{}", parts[0], parts[1]);
    let mut sig_b64 = parts[2].replace('-', "+").replace('_', "/");
    while sig_b64.len() % 4 != 0 {
        sig_b64.push('=');
    }
    if !verify_hmac(&signing_input, &sig_b64, secret)? {
        return Err("Invalid signature".into());
    }
    let claims_bytes = base64url_decode(parts[1])?;
    let claims: JwtClaims =
        serde_json::from_slice(&claims_bytes).map_err(|e| format!("Claims parse: {}", e))?;
    let now = chrono::Utc::now().timestamp() as u64;
    if claims.exp < now {
        return Err("Token expired".into());
    }
    Ok(claims)
}
