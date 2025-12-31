// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod settings;

use commands::{generate_output, scan_directory};
use settings::{load_settings, save_settings, load_selections, save_selections, SettingsData};

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

fn main() {
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
            save_selection_history
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
