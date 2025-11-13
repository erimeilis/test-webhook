/**
 * Webhook Ingestion Worker
 * High-performance Rust worker for receiving webhooks
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::JsValue;
use worker::*;

#[derive(Deserialize, Serialize)]
struct WebhookRow {
    id: String,
}

#[event(fetch)]
async fn main(mut req: Request, env: Env, _ctx: Context) -> Result<Response> {
    // Handle OPTIONS preflight requests
    if req.method() == Method::Options {
        let mut response = Response::empty()?;
        let headers = response.headers_mut();
        headers.set("Access-Control-Allow-Origin", "*")?;
        headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
        headers.set("Access-Control-Allow-Headers", "*")?;
        return Ok(response);
    }

    // Route: /w/{uuid}
    let url = req.url()?;
    let path = url.path();

    if !path.starts_with("/w/") {
        return Response::error("Not Found", 404);
    }

    let uuid = path.strip_prefix("/w/").unwrap_or("");

    if uuid.is_empty() {
        return Response::error("Invalid webhook URL", 400);
    }

    // Extract request data
    let method = req.method().to_string();

    // Collect headers as JSON
    let mut headers_map = HashMap::new();
    for (name, value) in req.headers() {
        headers_map.insert(name, value);
    }
    let _headers_json = serde_json::to_string(&headers_map)?;

    // Extract body or query params
    let data_json = if method == "POST" || method == "PUT" || method == "PATCH" {
        match req.text().await {
            Ok(body) => body,
            Err(_) => "{}".to_string(),
        }
    } else {
        // For GET requests, store query parameters
        let query_params: HashMap<String, String> = url
            .query_pairs()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect();
        serde_json::to_string(&query_params)?
    };

    let size_bytes = data_json.len() as i32;
    let received_at = (Date::now().as_millis() / 1000) as i64; // Convert to Unix seconds
    let data_id = uuid::Uuid::new_v4().to_string();

    // Get KV cache and D1 database
    let kv = env.kv("WEBHOOK_CACHE")?;
    let db = env.d1("DB")?;

    // Step 1: Lookup webhook ID (KV first, D1 fallback)
    let cache_key = format!("webhook:uuid:{}", uuid);
    let webhook_id: String;

    // Try KV cache first
    match kv.get(&cache_key).text().await? {
        Some(cached_id) => {
            // Cache hit! Use cached webhook ID
            webhook_id = cached_id;
            console_log!("✅ KV cache hit for UUID: {}", uuid);
        }
        None => {
            // Cache miss - query D1
            console_log!("❌ KV cache miss for UUID: {}, querying D1", uuid);

            let webhook_statement = db.prepare("SELECT id FROM webhooks WHERE uuid = ?1");
            let webhook_query = webhook_statement.bind(&[JsValue::from_str(uuid)])?;
            let webhook_result = webhook_query.first::<WebhookRow>(None).await?;

            match webhook_result {
                Some(webhook_row) => {
                    webhook_id = webhook_row.id.clone();

                    // Cache the result for future requests (1 hour TTL)
                    match kv.put(&cache_key, &webhook_id)?.expiration_ttl(3600).execute().await {
                        Ok(_) => console_log!("📝 Cached webhook ID in KV: {}", webhook_id),
                        Err(e) => console_error!("⚠️  Failed to cache webhook ID: {:?}", e),
                    }
                }
                None => {
                    // Webhook not found
                    return Response::error("Webhook not found", 404);
                }
            }
        }
    }

    // Step 2: Insert webhook data to D1
    let insert_statement = db.prepare("INSERT INTO webhook_data (id, webhook_id, method, headers, data, size_bytes, received_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)");
    let insert_query = insert_statement.bind(&[
        JsValue::from_str(&data_id),
        JsValue::from_str(&webhook_id),
        JsValue::from_str(&method),
        JsValue::from_str(&_headers_json),
        JsValue::from_str(&data_json),
        JsValue::from_f64(size_bytes as f64),
        JsValue::from_f64(received_at as f64),
    ])?;
    insert_query.run().await?;

    // Success response
    let mut response = Response::from_json(&serde_json::json!({
        "success": true,
        "message": "Webhook received",
        "webhook_id": uuid,
        "data_id": data_id,
        "method": method,
        "received_at": received_at,
        "size_bytes": size_bytes,
    }))?;

    let headers = response.headers_mut();
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "*")?;

    Ok(response)
}
