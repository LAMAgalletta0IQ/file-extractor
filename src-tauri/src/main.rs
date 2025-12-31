// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod settings;

use commands::{generate_output, scan_directory};
use settings::{load_settings, save_settings, load_selections, save_selections, SettingsData};
use tauri::Manager;

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
                use window_vibrancy::apply_mica;
                
                let window = app.get_window("main").expect("no main window");
                
                // Apply Mica blur effect on Windows (dark mode)
                // window-vibrancy 0.4 works with Tauri 1.5's window type
                apply_mica(&window, Some(true))
                    .expect("Failed to apply Mica effect");
                
                // Enable shadow for rounded corners on Windows
                // This helps with rounded corner rendering
                #[cfg(windows)]
                {
                    use tauri::Window;
                    // Shadow is enabled by default in Tauri 1.5 for transparent windows
                    // but we can ensure it's set if needed
                }
            }
            
            // Abilita devtools per debug (tasto destro -> Inspect o F12)
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_window("main") {
                    let _ = window.open_devtools();
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
