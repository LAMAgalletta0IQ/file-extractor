// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod settings;
mod notifications;

use commands::{generate_output, scan_directory};
use settings::{load_settings, save_settings, load_selections, save_selections, SettingsData};
use notifications::{register_app_for_notifications, show_windows_notification};
use std::sync::atomic::AtomicBool;
use once_cell::sync::Lazy;

// ============= GLOBAL STATE =============
pub(crate) static GENERATION_RUNNING: Lazy<AtomicBool> = Lazy::new(|| AtomicBool::new(false));

#[tauri::command]
fn get_settings() -> Result<SettingsData, String> {
    load_settings().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_settings(settings: SettingsData) -> Result<(), String> {
    save_settings(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_selections(folder_path: String) -> Result<Vec<String>, String> {
    load_selections(&folder_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_selection_history(folder_path: String, files: Vec<String>) -> Result<(), String> {
    save_selections(&folder_path, files).map_err(|e| e.to_string())
}

#[tauri::command]
fn send_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    // Use the Windows notification system that properly registers the app
    show_windows_notification(&app, &title, &body)
}

fn main() {
    // CRITICAL: Set AppUserModelID explicitly BEFORE any other operation
    // This forces Windows to use the registered DisplayName instead of AppUserModelID
    #[cfg(windows)]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use windows_sys::Win32::UI::Shell::SetCurrentProcessExplicitAppUserModelID;

        let app_id = "com.fileextractor.app";
        let app_id_wide: Vec<u16> = OsStr::new(app_id).encode_wide().chain(Some(0)).collect();

        unsafe {
            // SetCurrentProcessExplicitAppUserModelID returns HRESULT:
            // S_OK (0) = success
            let result = SetCurrentProcessExplicitAppUserModelID(app_id_wide.as_ptr());
            if result == 0 {
                eprintln!("[File Extractor] AppUserModelID set explicitly: {}", app_id);
            } else {
                eprintln!("[File Extractor] WARNING: Failed to set AppUserModelID explicitly: HRESULT 0x{:08X}", result);
            }
        }
    }

    // Register app for Windows Toast notifications BEFORE everything else
    // This is critical to correctly show name and icon in notifications
    #[cfg(windows)]
    {
        register_app_for_notifications();
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            generate_output,
            get_settings,
            update_settings,
            get_selections,
            save_selection_history,
            send_notification
        ])
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                use tauri::window::{Effect, EffectsBuilder};
                
                if let Some(window) = app.get_webview_window("main") {
                    // Apply Mica effect (Windows 11) - dark mode
                    // Fallback to Acrylic blur for Windows 10
                    let effects = EffectsBuilder::new()
                        .effect(Effect::Mica)
                        .build();
                    
                    if window.set_effects(effects).is_err() {
                        // Fallback to Acrylic blur if Mica is not available (Windows 10)
                        let blur_effects = EffectsBuilder::new()
                            .effect(Effect::Blur)
                            .build();
                        let _ = window.set_effects(blur_effects);
                    }
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
