#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;

use tauri::Manager;

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};
#[cfg(target_os = "macos")]
use cocoa::base::id;
use serde::{Serialize, Deserialize};
use std::sync::atomic::{AtomicBool, Ordering};

static MIC_ACTIVE: AtomicBool = AtomicBool::new(false);

#[derive(Serialize, Deserialize)]
struct Session {
    id: i32,
    title: String,
    date: String,
    transcript: String,
    summary: String,
    action_items: String,
}

#[tauri::command]
async fn db_save_api_key(app: tauri::AppHandle, name: String, provider: String, key_value: String) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    let conn = rusqlite::Connection::open(db_path).map_err(|e| e.to_string())?;
    
    let id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis()
        .to_string();

    conn.execute(
        "INSERT INTO api_keys (id, name, provider, key_value, is_active) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![id, name, provider, key_value, 0],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn db_get_api_keys(app: tauri::AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    let conn = rusqlite::Connection::open(db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT id, name, provider, is_active FROM api_keys").map_err(|e| e.to_string())?;
    let keys = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "provider": row.get::<_, String>(2)?,
            "isActive": row.get::<_, i32>(3)? == 1
        }))
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for key in keys {
        result.push(key.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
async fn db_delete_api_key(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    let conn = rusqlite::Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM api_keys WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn db_set_active_key(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    let conn = rusqlite::Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute("UPDATE api_keys SET is_active = 0", []).map_err(|e| e.to_string())?;
    conn.execute("UPDATE api_keys SET is_active = 1 WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn db_get_active_key(app: tauri::AppHandle) -> Result<Option<(String, String)>, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    let conn = rusqlite::Connection::open(db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT key_value, provider FROM api_keys WHERE is_active = 1 LIMIT 1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some((row.get::<_, String>(0).map_err(|e| e.to_string())?, row.get::<_, String>(1).map_err(|e| e.to_string())?)))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn capture_screen(window: tauri::Window) -> Result<String, String> {
    use xcap::Monitor as XMonitor;
    use std::io::Cursor;
    use base64::Engine;

    let t_monitor = window.current_monitor().map_err(|e| e.to_string())?
        .ok_or("Could not detect current monitor")?;
    let t_name = t_monitor.name().map_or("", |v| v);

    let xmonitors = XMonitor::all().map_err(|e| e.to_string())?;
    
    let target_monitor = xmonitors.into_iter()
        .find(|m| m.name() == t_name || t_name.contains(m.name()) || m.name().contains(t_name))
        .unwrap_or_else(|| {
            XMonitor::all().unwrap().into_iter()
                .find(|m| m.is_primary())
                .unwrap_or_else(|| XMonitor::all().unwrap()[0].clone())
        });
    
    let image = target_monitor.capture_image().map_err(|e| e.to_string())?;
    
    let dynamic_img = image::DynamicImage::ImageRgba8(image);
    
    let mut bytes: Vec<u8> = Vec::new();
    dynamic_img.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Jpeg).map_err(|e| e.to_string())?;
    
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:image/jpeg;base64,{}", b64))
}

#[tauri::command]
async fn ask_llm(
    prompt: String, 
    image_base64: String,
    transcript_context: String,
    api_key: String,
    provider: String,
    model: String
) -> Result<String, String> {
    use serde_json::json;
    let http_client = reqwest::Client::new();
    let p_lower = provider.to_lowercase();

    let fluely_description = "\
You are Fluely, an AI copilot assisting the user in a live interview/meeting.

Crucial Guidelines for your responses:
- Speak/answer like a human: Formulate suggestions exactly as a qualified human candidate would speak in a real interview.
- NEVER sound like an AI: Avoid conversational filler, generic greetings, introductions, or disclaimers (e.g., do NOT start with \"Sure, I can help with that\", \"Based on the transcript...\", or \"As an AI...\"). Get straight to the answer.
- Keep responses short and concise: Answers must be bite-sized and punchy so they can be easily read and spoken in a fast-paced live meeting. Avoid wall-of-text outputs.
- Professional yet conversational: Use realistic human phrasing, not robotic patterns.

System Context:
Audio → Speech-to-Text → Context AI → LLM → Live Suggestions.
- Captures audio: Reads microphone + meeting audio.
- Real-time transcription: Speech recognition converts voice into text continuously.
- Context engine: Builds a live \"memory\" containing: current conversation, previous messages, uploaded docs/resume, company info, role/interview topic.
- LLM reasoning: Predicts: best reply, coding answer, objection handling, follow-up question, concise explanation.
- Fast retrieval (RAG): Searches notes, PDFs, CRM/company database, internet snippets.
- Overlay output: Suggestions appear as: floating overlay, side panel, hidden assistant window.";

    if p_lower == "gemini" {
        let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent", model);
        let mut parts = vec![
            json!({"text": prompt})
        ];
        if !image_base64.is_empty() {
            let clean_b64 = image_base64.split(',').nth(1).unwrap_or(&image_base64);
            parts.push(json!({"inlineData": {"mimeType": "image/jpeg", "data": clean_b64}}));
        }
        
        let res = http_client.post(url)
            .header("x-goog-api-key", api_key)
            .json(&json!({
                "contents": [{"parts": parts}],
                "systemInstruction": {
                    "parts": [{"text": format!("{}\n\nContext:\n{}", fluely_description, transcript_context)}]
                },
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4096}
            }))
            .send().await.map_err(|e| e.to_string())?;
            
        let status = res.status();
        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        
        if !status.is_success() {
            let err_msg = json["error"]["message"].as_str()
                .or(json["error"][0]["message"].as_str())
                .unwrap_or("Unknown Gemini API error");
            return Err(format!("Gemini Error ({}): {}", status, err_msg));
        }

        return Ok(json["candidates"][0]["content"]["parts"][0]["text"].as_str()
            .unwrap_or("No response content from Gemini (Check safety settings or prompt)").to_string());
    }

    if p_lower == "anthropic" {
        let mut content = vec![json!({ "type": "text", "text": prompt })];
        if !image_base64.is_empty() {
            let clean_b64 = image_base64.split(',').nth(1).unwrap_or(&image_base64);
            content.insert(0, json!({
                "type": "image",
                "source": { "type": "base64", "media_type": "image/jpeg", "data": clean_b64 }
            }));
        }
        let res = http_client.post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&json!({
                "model": model, "max_tokens": 2048,
                "system": format!("{}\n\nContext:\n{}", fluely_description, transcript_context),
                "messages": [{"role": "user", "content": content}]
            })).send().await.map_err(|e| e.to_string())?;
        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        return Ok(json["content"][0]["text"].as_str().unwrap_or("No response from Anthropic").to_string());
    }

    let url = match p_lower.as_str() {
        "grok" => "https://api.x.ai/v1/chat/completions",
        "mistral" => "https://api.mistral.ai/v1/chat/completions",
        "deepseek" => "https://api.deepseek.com/chat/completions",
        "qwen" => "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "kimi" => "https://api.moonshot.cn/v1/chat/completions",
        "zai" => "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        p if p.contains("local") => "http://localhost:8080/v1/chat/completions",
        _ => "https://api.openai.com/v1/chat/completions",
    };

    let mut user_content = vec![json!({ "type": "text", "text": prompt })];
    if !image_base64.is_empty() {
        user_content.push(json!({ "type": "image_url", "image_url": { "url": image_base64 } }));
    }

    let mut request = http_client.post(url);
    if !p_lower.contains("local") {
        request = request.header("Authorization", format!("Bearer {}", api_key));
    }

    let res = request.json(&json!({
        "model": model, "max_tokens": 2048,
        "messages": [
            {"role": "system", "content": format!("{}\n\nContext:\n{}", fluely_description, transcript_context)},
            {"role": "user", "content": user_content}
        ]
    })).send().await.map_err(|e| e.to_string())?;

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    
    if let Some(err) = json.get("error") {
        return Err(err["message"].as_str().unwrap_or("API Error").to_string());
    }

    Ok(json["choices"][0]["message"]["content"].as_str().unwrap_or("No response").to_string())
}

#[tauri::command]
fn get_audio_devices() -> Result<(String, String), String> {
    use cpal::traits::{DeviceTrait, HostTrait};
    let host = cpal::default_host();
    let mic = host.default_input_device().map(|d| d.name().unwrap_or_default()).unwrap_or("None".to_string());
    let speaker = host.default_output_device().map(|d| d.name().unwrap_or_default()).unwrap_or("None".to_string());
    Ok((mic, speaker))
}

#[tauri::command]
fn save_session(app: tauri::AppHandle, title: String, transcript: String, summary: String, action_items: String) -> Result<(), String> {
    use rusqlite::Connection;
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&app_data).map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO sessions (title, date, transcript, summary, action_items) VALUES (?1, datetime('now'), ?2, ?3, ?4)",
        rusqlite::params![title, transcript, summary, action_items]
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn get_sessions(app: tauri::AppHandle) -> Result<Vec<Session>, String> {
    use rusqlite::Connection;
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    
    if !db_path.exists() {
        return Ok(Vec::new());
    }

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT id, title, date, transcript, summary, action_items FROM sessions ORDER BY date DESC").map_err(|e| e.to_string())?;
    let session_iter = stmt.query_map([], |row| {
        Ok(Session {
            id: row.get(0)?,
            title: row.get(1)?,
            date: row.get(2)?,
            transcript: row.get(3)?,
            summary: row.get(4).unwrap_or_default(),
            action_items: row.get(5).unwrap_or_default(),
        })
    }).map_err(|e| e.to_string())?;
    
    let mut sessions = Vec::new();
    for session in session_iter {
        sessions.push(session.map_err(|e| e.to_string())?);
    }
    
    Ok(sessions)
}

#[tauri::command]
fn delete_session(app: tauri::AppHandle, id: i32) -> Result<(), String> {
    use rusqlite::Connection;
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM sessions WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn update_session_title(app: tauri::AppHandle, id: i32, title: String) -> Result<(), String> {
    use rusqlite::Connection;
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("fluely.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute("UPDATE sessions SET title = ?1 WHERE id = ?2", rusqlite::params![title, id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn set_overlay_mode(window: tauri::Window) -> Result<(), String> {
    use tauri::{LogicalSize, Size};
    window.set_size(Size::Logical(LogicalSize { width: 680.0, height: 640.0 })).map_err(|e| e.to_string())?;
    window.set_always_on_top(true).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        if let Ok(hwnd) = window.hwnd() {
            unsafe {
                let handle = windows::Win32::Foundation::HWND(hwnd.0 as _);
                let _ = windows::Win32::UI::WindowsAndMessaging::SetWindowDisplayAffinity(handle, windows::Win32::UI::WindowsAndMessaging::WDA_EXCLUDEFROMCAPTURE);
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_win = ns_window as cocoa::base::id;
                let () = objc::msg_send![ns_win, setSharingType: 0u32];
            }
        }
    }

    Ok(())
}

#[tauri::command]
async fn set_home_mode(window: tauri::Window) -> Result<(), String> {
    use tauri::{LogicalSize, Size};

    #[cfg(target_os = "windows")]
    {
        if let Ok(hwnd) = window.hwnd() {
            unsafe {
                let handle = windows::Win32::Foundation::HWND(hwnd.0 as _);
                let _ = windows::Win32::UI::WindowsAndMessaging::SetWindowDisplayAffinity(handle, windows::Win32::UI::WindowsAndMessaging::WDA_NONE);
            }
        }
    }

    let _ = window.set_always_on_top(false);
    let _ = window.set_resizable(true);

    #[cfg(target_os = "windows")]
    {
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        let _ = window.set_size(Size::Logical(LogicalSize { width: 1023.0, height: 575.0 }));
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }

    window.set_size(Size::Logical(LogicalSize { width: 1024.0, height: 576.0 })).map_err(|e| e.to_string())?;
    let _ = window.center();

    #[cfg(target_os = "macos")]
    {
        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_win = ns_window as cocoa::base::id;
                let () = objc::msg_send![ns_win, setSharingType: 1u32];
            }
        }
    }

    Ok(())
}

#[tauri::command]
fn set_mic_active(active: bool) -> Result<(), String> {
    println!("Microphone status changed: {}", active);
    MIC_ACTIVE.store(active, Ordering::SeqCst);
    Ok(())
}

fn main() {
    use sha2::{Sha256, Digest};
    use tauri_plugin_stronghold::Builder as StrongholdBuilder;

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(StrongholdBuilder::new(|password| {
            let mut hasher = Sha256::new();
            hasher.update(password.as_bytes());
            let hash: [u8; 32] = hasher.finalize().into();
            hash.to_vec()
        }).build())
        .setup(|app| {

            

            if let Ok(app_data) = app.path().app_data_dir() {
                let _ = std::fs::create_dir_all(&app_data);
                let db_path = app_data.join("fluely.db");
                if let Ok(conn) = rusqlite::Connection::open(&db_path) {
                    let _ = conn.execute(
                        "CREATE TABLE IF NOT EXISTS sessions (
                            id INTEGER PRIMARY KEY,
                            title TEXT NOT NULL,
                            date TEXT NOT NULL,
                            transcript TEXT NOT NULL,
                            summary TEXT DEFAULT '',
                            action_items TEXT DEFAULT ''
                        )",
                        [],
                    );

            

                    let _ = conn.execute("ALTER TABLE sessions ADD COLUMN summary TEXT DEFAULT ''", []);
                    let _ = conn.execute("ALTER TABLE sessions ADD COLUMN action_items TEXT DEFAULT ''", []);
                    let _ = conn.execute(
                        "CREATE TABLE IF NOT EXISTS api_keys (
                            id TEXT PRIMARY KEY,
                            name TEXT NOT NULL,
                            provider TEXT NOT NULL,
                            key_value TEXT NOT NULL,
                            is_active INTEGER DEFAULT 0
                        )",
                        [],
                    );
                }
            }

            if let Ok(stream) = audio::initialize_os_microphones() {
                std::mem::forget(stream);
            } else {
                eprintln!("Failed to initialize audio capture natively.");
            }


            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            capture_screen, 
            ask_llm, 
            get_audio_devices, 
            save_session, 
            get_sessions, 
            delete_session,
            update_session_title,
            set_overlay_mode, 
            set_home_mode,
            set_mic_active,
            db_save_api_key,
            db_get_api_keys,
            db_delete_api_key,
            db_set_active_key,
            db_get_active_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
